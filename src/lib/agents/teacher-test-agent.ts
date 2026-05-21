export interface TeacherTestAgentTask {
  id: string;
  label: string;
  setNumber: number;
  startQuestion: number;
  endQuestion: number;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
}

export interface TeacherTestAgentPlan {
  requestedSets: number;
  questionsPerSet: number;
  totalQuestions: number;
  questionsPerTask: number;
  tasks: TeacherTestAgentTask[];
}

const DEFAULT_QUESTIONS_PER_TASK = 10;

export function createTeacherTestAgentPlan(request: string, questionsPerTask = DEFAULT_QUESTIONS_PER_TASK): TeacherTestAgentPlan {
  const requestedSets = clamp(extractNumberBeforeKeyword(request, ["đề", "de", "bộ", "bo"]) ?? 1, 1, 20);
  const questionsPerSet = clamp(extractNumberBeforeKeyword(request, ["câu", "cau"]) ?? questionsPerTask, 1, 80);
  const safeQuestionsPerTask = clamp(questionsPerTask, 5, 15);
  const tasks: TeacherTestAgentTask[] = [];

  for (let setNumber = 1; setNumber <= requestedSets; setNumber += 1) {
    for (let startQuestion = 1; startQuestion <= questionsPerSet; startQuestion += safeQuestionsPerTask) {
      const endQuestion = Math.min(startQuestion + safeQuestionsPerTask - 1, questionsPerSet);
      const count = endQuestion - startQuestion + 1;
      const distribution = distributeDifficulty(count);

      tasks.push({
        id: `set-${setNumber}-q-${startQuestion}-${endQuestion}`,
        label: `Đề ${setNumber}, Câu ${startQuestion}-${endQuestion}`,
        setNumber,
        startQuestion,
        endQuestion,
        ...distribution,
      });
    }
  }

  return {
    requestedSets,
    questionsPerSet,
    totalQuestions: requestedSets * questionsPerSet,
    questionsPerTask: safeQuestionsPerTask,
    tasks,
  };
}

export function formatTeacherTestAgentPrompt(request: string, plan: TeacherTestAgentPlan, taskIndex = 0) {
  const task = plan.tasks[taskIndex] ?? plan.tasks[0];
  if (!task) {
    return request;
  }

  const remainingTasks = Math.max(plan.tasks.length - taskIndex - 1, 0);

  return [
    "Bạn đang đóng vai Teacher Test Sub-Agent.",
    "Mục tiêu: tạo một phần nhỏ của đề kiểm tra để tránh timeout AI Gateway.",
    "",
    "Quy tắc bắt buộc:",
    "- Chỉ làm đúng task được giao, không sinh toàn bộ đề trong một lần.",
    "- Mỗi câu phải có 4 phương án A, B, C, D.",
    "- Mỗi câu phải có dòng Đáp án: <A/B/C/D>.",
    "- Nếu có lời giải, ghi ngắn gọn nhưng đủ kiểm tra.",
    "- Đánh số câu đúng khoảng được giao trong đề hiện tại.",
    `- Trong mỗi đề, câu chỉ chạy từ 1 đến ${plan.questionsPerSet}; KHÔNG dùng số câu toàn cục như Câu ${plan.questionsPerSet + 1}, Câu ${plan.questionsPerSet + 2}.`,
    "- Khi sang đề mới, bắt đầu lại từ Câu 1 và ghi rõ tiêu đề Đề mới.",
    "- Không nhắc lại câu đã có ở phần trước.",
    "",
    "Kế hoạch tổng:",
    `- Số đề: ${plan.requestedSets}`,
    `- Số câu mỗi đề: ${plan.questionsPerSet}`,
    `- Tổng số task nhỏ: ${plan.tasks.length}`,
    `- Mỗi task khoảng: ${plan.questionsPerTask} câu`,
    "",
    "Task hiện tại:",
    `- ${task.label}`,
    `- Số câu dễ: ${task.easyCount}`,
    `- Số câu trung bình: ${task.mediumCount}`,
    `- Số câu khó: ${task.hardCount}`,
    "",
    "Định dạng trả lời:",
    `## Đề ${task.setNumber} - Phần Câu ${task.startQuestion}-${task.endQuestion}`,
    "### Câu n",
    "Nội dung câu hỏi...",
    "A. ...",
    "B. ...",
    "C. ...",
    "D. ...",
    "Đáp án: ...",
    "Lời giải: ...",
    "",
    remainingTasks > 0
      ? `[Còn tiếp - gửi "tiếp tục" để tạo task kế tiếp: ${plan.tasks[taskIndex + 1]?.label}]`
      : "[Đã hoàn thành các task theo kế hoạch hiện tại]",
    "",
    "Yêu cầu gốc của giáo viên:",
    request,
  ].join("\n");
}

export function formatTeacherTestContinuationPrompt(
  request: string,
  plan: TeacherTestAgentPlan,
  previousAssistantContent: string
) {
  const progress = inferLastProgress(previousAssistantContent, plan);
  const nextSetNumber = progress.lastQuestionNumber >= plan.questionsPerSet
    ? progress.setNumber + 1
    : progress.setNumber;
  const nextQuestionNumber = progress.lastQuestionNumber >= plan.questionsPerSet
    ? 1
    : progress.lastQuestionNumber + 1;
  const taskIndex = plan.tasks.findIndex((task) =>
    task.setNumber === nextSetNumber &&
    nextQuestionNumber >= task.startQuestion &&
    nextQuestionNumber <= task.endQuestion
  );

  return formatTeacherTestAgentPrompt(request, plan, taskIndex >= 0 ? taskIndex : 0);
}

function distributeDifficulty(count: number) {
  const easyCount = Math.max(1, Math.round(count * 0.3));
  const hardCount = Math.max(1, Math.round(count * 0.2));
  const mediumCount = Math.max(0, count - easyCount - hardCount);

  return {
    easyCount,
    mediumCount,
    hardCount,
  };
}

function extractNumberBeforeKeyword(content: string, keywords: string[]) {
  const normalized = normalizeForIntent(content);
  const pattern = new RegExp(`(\\d+)\\s*(?:${keywords.join("|")})`, "i");
  const match = normalized.match(pattern);
  return match?.[1] ? Number(match[1]) : null;
}

function inferLastProgress(content: string, plan: TeacherTestAgentPlan) {
  const lines = content.split('\n');
  let lastQuestionNumber = 0;
  let setNumber = 1;

  const questionRegex = /^###\s*(?:câu|cau|bài|bai|câu số|cau so)?\s*(\d+)/i;
  const setRegex = /^##\s*(?:đề|de|bộ|bo)\s*(\d+)/i;

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;

    if (lastQuestionNumber === 0) {
      const qMatch = line.match(questionRegex);
      if (qMatch) {
        const qNum = Number(qMatch[1]);
        if (Number.isFinite(qNum) && qNum > 0) {
          lastQuestionNumber = qNum;
        }
      }
    }

    const sMatch = line.match(setRegex);
    if (sMatch) {
      const sNum = Number(sMatch[1]);
      if (Number.isFinite(sNum) && sNum > 0 && sNum <= plan.requestedSets) {
        setNumber = sNum;
        if (lastQuestionNumber > 0) {
          break;
        }
      }
    }
  }

  // Fallback if no structured headings are found
  if (lastQuestionNumber === 0 || setNumber === 1) {
    const normalized = normalizeForIntent(content);
    if (setNumber === 1) {
      const setMatches = Array.from(normalized.matchAll(/(?:de|bo)\s*(\d+)/g));
      const setNumbers = setMatches
        .map((match) => Number(match[1]))
        .filter((value) => Number.isFinite(value) && value > 0 && value <= plan.requestedSets);
      if (setNumbers.length) {
        setNumber = setNumbers[setNumbers.length - 1];
      }
    }

    if (lastQuestionNumber === 0) {
      const questionMatches = Array.from(normalized.matchAll(/(?:cau|bai)\s*(\d+)/g));
      const questionNumbers = questionMatches
        .map((match) => Number(match[1]))
        .filter((value) => Number.isFinite(value) && value > 0);
      if (questionNumbers.length) {
        lastQuestionNumber = Math.max(...questionNumbers);
      }
    }
  }

  if (lastQuestionNumber > plan.questionsPerSet) {
    lastQuestionNumber = ((lastQuestionNumber - 1) % plan.questionsPerSet) + 1;
  }

  return {
    setNumber,
    lastQuestionNumber,
  };
}

function normalizeForIntent(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
