export type AssistantModeId = "teacher";

export interface AssistantModeConfig {
  id: AssistantModeId;
  route: string;
  badge: string;
  title: string;
  subtitle: string;
  audience: string;
  primaryUse: string;
  model: {
    provider: string;
    name: string;
    temperature: number;
    maxOutputTokens: number;
  };
  strengths: string[];
  limits: string[];
  workflow: string[];
  outputs: string[];
  workspace: {
    name: string;
    subtitle: string;
    emptyTitle: string;
    inputPlaceholder: string;
    emptySubtitle: string;
    setupTitle: string;
    setupItems: string[];
    toolTitle: string;
    tools: Array<{
      label: string;
      description: string;
      prompt: string;
    }>;
    promptStarters: Array<{
      label: string;
      text: string;
    }>;
    reviewChecklist: string[];
  };
  systemPrompt: string;
}

export const ASSISTANT_MODES: Record<AssistantModeId, AssistantModeConfig> = {
  teacher: {
    id: "teacher",
    route: "/teacher",
    badge: "Dành cho giáo viên",
    title: "Soạn tài liệu dạy học nhanh, dễ kiểm tra và dễ chỉnh.",
    subtitle:
      "Tập trung vào mục tiêu bài học, hoạt động lớp, câu hỏi gợi mở, bài tập phân tầng và tài liệu có thể dùng ngay.",
    audience: "Giáo viên, trung tâm, người soạn học liệu",
    primaryUse:
      "Biến chủ đề, đề cương hoặc file có sẵn thành giáo án, phiếu học tập, đề kiểm tra và đáp án.",
    model: {
      provider: "Gemini",
      name: "gemini-3-flash-preview",
      temperature: 0.35,
      maxOutputTokens: 4500,
    },
    strengths: [
      "Tách mục tiêu kiến thức, kỹ năng, năng lực và phẩm chất.",
      "Tạo hoạt động mở bài, hình thành kiến thức, luyện tập và vận dụng theo tiến trình lớp học.",
      "Có thể xuất nhiều phiên bản: giáo án ngắn, giáo án chi tiết, phiếu học tập, ma trận đề.",
      "Ưu tiên ngôn ngữ sư phạm, kiểm tra hiểu bài và gợi ý chữa lỗi sai phổ biến.",
    ],
    limits: [
      "Cần giáo viên kiểm tra chuẩn chương trình, thời lượng và yêu cầu riêng của trường.",
      "Không thay thế kinh nghiệm đứng lớp, quản lý học sinh hoặc điều chỉnh theo lớp thật.",
      "Với tài liệu scan mờ, cần xác nhận lại đề bài và công thức trước khi dùng chính thức.",
    ],
    workflow: [
      "Nhập chủ đề, khối lớp, thời lượng và mục tiêu.",
      "AI hỏi thêm nếu thiếu chuẩn đầu ra, dạng lớp hoặc mức độ học sinh.",
      "Tạo giáo án theo mẫu có hoạt động, câu hỏi, dự kiến đáp án.",
      "Cho giáo viên chọn phiên bản để xuất DOCX hoặc copy từng phần.",
    ],
    outputs: ["Giáo án 45 phút", "Phiếu học tập", "Ma trận đề", "Đáp án - thang điểm"],
    workspace: {
      name: "Teacher Studio",
      subtitle: "Tạo giáo án, phiếu học tập, đề kiểm tra từ chủ đề hoặc file có sẵn.",
      emptyTitle: "Thầy cô muốn tạo tài liệu nào hôm nay?",
      emptySubtitle:
        "Chọn một mẫu có sẵn hoặc kéo file vào ô chat. Nếu còn thiếu lớp, thời lượng hay mức độ học sinh, AI sẽ hỏi lại trước khi soạn.",
      inputPlaceholder: "Ví dụ: Soạn giáo án tích phân lớp 12 trong 45 phút...",
      setupTitle: "Bắt đầu trong 3 bước",
      setupItems: [
        "Chọn loại tài liệu muốn tạo.",
        "Thêm chủ đề, khối lớp hoặc kéo file vào chat.",
        "Duyệt bản nháp, yêu cầu sửa rồi xuất Word/PDF khi cần.",
      ],
      toolTitle: "Việc thường dùng",
      tools: [
        {
          label: "Giáo án 45 phút",
          description: "Có mục tiêu, hoạt động lớp, câu hỏi gợi mở và dặn dò.",
          prompt:
            "Hãy soạn giáo án Toán theo cấu trúc: thông tin bài học, mục tiêu, chuẩn bị, tiến trình dạy học, hoạt động giáo viên - học sinh, câu hỏi gợi mở, bài tập luyện tập, vận dụng, dặn dò. Nếu thiếu khối lớp hoặc thời lượng, hãy hỏi lại trước.",
        },
        {
          label: "Phiếu học tập",
          description: "Bài tập phân tầng, có đáp án ngắn và lỗi sai thường gặp.",
          prompt:
            "Tạo phiếu học tập cho chủ đề này. Chia thành: khởi động, nhận biết, thông hiểu, vận dụng, vận dụng cao. Thêm đáp án ngắn và ghi chú lỗi sai thường gặp.",
        },
        {
          label: "Đề kiểm tra 15 phút",
          description: "Tạo đề 10-15 phút kèm đáp án và thang điểm.",
          prompt:
            "Tạo một bài kiểm tra nhanh 15 phút. Có ma trận năng lực, 8 câu trắc nghiệm, 2 câu tự luận, đáp án, thang điểm và gợi ý chấm.",
        },
        {
          label: "Đọc file tài liệu",
          description: "Rút ý chính từ file và đề xuất cách biến thành bài dạy.",
          prompt:
            "Phân tích toàn bộ tài liệu đã đưa lên. Tóm tắt cấu trúc, trích nội dung quan trọng, đề xuất cách biến thành giáo án, phiếu học tập và câu hỏi kiểm tra. Ghi rõ phần cần kiểm chứng nguồn.",
        },
        {
          label: "Nguồn tham khảo",
          description: "Gợi ý phần nguồn, ghi rõ mục cần kiểm chứng.",
          prompt:
            "Từ nội dung hiện có, hãy lập phần nguồn tham khảo và ghi chú sử dụng. Không bịa nguồn. Nếu chưa đủ dữ liệu nguồn, hãy tạo mục 'Cần giáo viên bổ sung/kiểm chứng'.",
        },
      ],
      promptStarters: [
        {
          label: "Soạn giáo án",
          text: "Soạn giáo án 45 phút cho chủ đề hàm số bậc hai lớp 10. Có mục tiêu, hoạt động mở bài, luyện tập, vận dụng và dặn dò.",
        },
        {
          label: "Tạo đề kiểm tra",
          text: "Tạo đề kiểm tra 15 phút về tích phân cơ bản. Có câu dễ, trung bình, khó, đáp án và thang điểm.",
        },
        {
          label: "Biến file thành phiếu học tập",
          text: "Đọc file tôi đưa lên và chuyển thành phiếu học tập phân tầng cho học sinh, có đáp án ngắn ở cuối.",
        },
      ],
      reviewChecklist: [
        "Đã đúng chuẩn chương trình và thời lượng chưa?",
        "Có câu hỏi gợi mở thay vì chỉ đưa lời giải không?",
        "Có phân tầng học sinh yếu - trung bình - khá giỏi không?",
        "Có đáp án, thang điểm và lưu ý sư phạm không?",
      ],
    },
    systemPrompt:
      "Bạn là trợ lý sư phạm cho giáo viên Toán. Luôn trả lời bằng tiếng Việt, trình bày có cấu trúc, ưu tiên mục tiêu bài học, hoạt động dạy học, câu hỏi gợi mở, bài tập phân tầng, đáp án và lưu ý sư phạm. Nếu thiếu khối lớp, thời lượng, chuẩn chương trình hoặc mức độ học sinh, hãy hỏi lại ngắn gọn trước khi soạn. Không bịa nguồn chương trình; đánh dấu phần cần giáo viên xác nhận.",
  },
};
