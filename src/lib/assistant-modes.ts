export type AssistantModeId = "teacher" | "study";

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
    badge: "Mode giáo viên",
    title: "Soạn giáo án nhanh, vẫn giữ chất riêng của thầy cô.",
    subtitle:
      "Tập trung vào mục tiêu bài học, hoạt động lớp, câu hỏi gợi mở, bài tập phân tầng và tài liệu có thể dùng ngay.",
    audience: "Giáo viên, trung tâm, người soạn học liệu",
    primaryUse: "Biến đề cương hoặc chủ đề thành giáo án, phiếu học tập, slide outline và bài kiểm tra ngắn.",
    model: {
      provider: "Gemini",
      name: "gemini-3-flash-preview",
      temperature: 0.35,
      maxOutputTokens: 4500,
    },
    strengths: [
      "Biết tách mục tiêu kiến thức, kỹ năng, năng lực và phẩm chất.",
      "Tạo hoạt động mở bài, hình thành kiến thức, luyện tập, vận dụng theo tiến trình lớp học.",
      "Có thể xuất nhiều phiên bản: giáo án ngắn, giáo án chi tiết, phiếu học tập, ma trận đề.",
      "Ưu tiên ngôn ngữ sư phạm, có kiểm tra hiểu bài và gợi ý chữa lỗi sai phổ biến.",
    ],
    limits: [
      "Cần giáo viên kiểm tra chuẩn chương trình, thời lượng và yêu cầu của trường.",
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
      subtitle: "Soạn giáo án, học liệu, đề kiểm tra và tài liệu tham khảo.",
      emptyTitle: "Hôm nay thầy cô muốn soạn gì?",
      emptySubtitle: "Chọn một việc bên dưới, hoặc kéo tài liệu vào khung chat để AI đọc và soạn theo yêu cầu.",
      inputPlaceholder: "Nhập chủ đề, khối lớp, tài liệu hoặc yêu cầu soạn giáo án...",
      setupTitle: "Hồ sơ soạn bài",
      setupItems: [
        "Gõ chủ đề hoặc kéo tài liệu vào khung chat.",
        "Chọn việc cần làm: giáo án, phiếu học tập hoặc đề kiểm tra.",
        "Đọc bản nháp, yêu cầu chỉnh sửa rồi xuất Word khi cần.",
      ],
      toolTitle: "Thầy cô muốn làm gì?",
      tools: [
        {
          label: "Soạn giáo án",
          description: "Có mục tiêu, hoạt động lớp, câu hỏi và dặn dò.",
          prompt:
            "Hãy soạn giáo án Toán theo cấu trúc: thông tin bài học, mục tiêu, chuẩn bị, tiến trình dạy học, hoạt động giáo viên - học sinh, câu hỏi gợi mở, bài tập luyện tập, vận dụng, dặn dò. Nếu thiếu khối lớp hoặc thời lượng, hãy hỏi lại trước.",
        },
        {
          label: "Phiếu học tập",
          description: "Bài tập theo mức độ, có đáp án và lỗi sai thường gặp.",
          prompt:
            "Tạo phiếu học tập cho chủ đề này. Chia thành: khởi động, nhận biết, thông hiểu, vận dụng, vận dụng cao. Thêm đáp án ngắn và ghi chú lỗi sai thường gặp.",
        },
        {
          label: "Bài kiểm tra nhanh",
          description: "Tạo đề 10-15 phút kèm đáp án và thang điểm.",
          prompt:
            "Tạo một bài kiểm tra nhanh 15 phút. Có ma trận năng lực, 8 câu trắc nghiệm, 2 câu tự luận, đáp án, thang điểm và gợi ý chấm.",
        },
        {
          label: "Phân tích tài liệu",
          description: "Đọc file đưa lên rồi rút ý chính để soạn bài.",
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
          label: "Soạn giáo án từ chủ đề",
          text: "Soạn giáo án 45 phút cho chủ đề hàm số bậc hai lớp 10, có hoạt động mở bài, luyện tập và vận dụng.",
        },
        {
          label: "Tạo đề kiểm tra nhanh",
          text: "Tạo bài kiểm tra nhanh 15 phút về tích phân cơ bản, có đáp án và thang điểm.",
        },
        {
          label: "Biến file thành phiếu học tập",
          text: "Đọc file tôi đưa lên và chuyển thành phiếu học tập phân tầng cho học sinh.",
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
  study: {
    id: "study",
    route: "/newchat",
    badge: "Mode học sinh & phụ huynh",
    title: "Giải bài tập dễ hiểu, giúp học sinh tự làm lại được.",
    subtitle:
      "Tập trung vào giải thích từng bước, phát hiện lỗi sai, nhắc công thức cần nhớ và tạo bài tương tự để luyện thêm.",
    audience: "Học sinh, phụ huynh, người tự học",
    primaryUse: "Chụp bài tập, gửi đề hoặc file, rồi nhận lời giải dễ hiểu kèm cách tự kiểm tra.",
    model: {
      provider: "Gemini",
      name: "gemini-3-flash-preview",
      temperature: 0.2,
      maxOutputTokens: 3500,
    },
    strengths: [
      "Giải từng bước, tránh nhảy kết quả quá nhanh.",
      "Nêu công thức dùng ở mỗi bước và vì sao dùng công thức đó.",
      "Có phần kiểm tra đáp án, lỗi sai thường gặp và bài luyện tương tự.",
      "Ngôn ngữ dễ hiểu cho học sinh, phụ huynh cũng có thể theo dõi.",
    ],
    limits: [
      "Không khuyến khích chép đáp án mà không hiểu; mode này ưu tiên gợi ý và giải thích.",
      "Với bài thi thật hoặc điểm số quan trọng, cần tự kiểm tra lại kết quả.",
      "Một số ảnh đề bài mờ có thể làm sai ký hiệu, cần xác nhận lại trước khi giải.",
    ],
    workflow: [
      "Gửi câu hỏi, ảnh hoặc file bài tập.",
      "AI tóm tắt đề và hỏi lại nếu ký hiệu chưa rõ.",
      "Giải theo từng bước, có công thức và chú thích ngắn.",
      "Tạo bài tương tự để học sinh luyện sau khi hiểu lời giải.",
    ],
    outputs: ["Lời giải từng bước", "Gợi ý trước khi xem đáp án", "Bài tương tự", "Tóm tắt công thức cần nhớ"],
    workspace: {
      name: "Study Coach",
      subtitle: "Giải bài tập, so sánh hướng giải và luyện lại đến khi hiểu.",
      emptyTitle: "Bạn muốn giải bài nào hôm nay?",
      emptySubtitle: "Bấm một lựa chọn bên dưới, gửi ảnh/file bài tập, hoặc gõ câu hỏi theo cách tự nhiên.",
      inputPlaceholder: "Gửi bài tập, ảnh, file hoặc hỏi cách giải...",
      setupTitle: "Hồ sơ học tập",
      setupItems: [
        "Gửi ảnh bài tập, file đề hoặc gõ câu hỏi.",
        "Chọn kiểu hỗ trợ: gợi ý, giải chi tiết hoặc nhiều cách giải.",
        "Đọc từng bước, hỏi lại chỗ chưa hiểu rồi luyện bài tương tự.",
      ],
      toolTitle: "Bạn cần hỗ trợ kiểu nào?",
      tools: [
        {
          label: "Giải từng bước",
          description: "Đi chậm từng dòng, có công thức và kiểm tra lại.",
          prompt:
            "Giải bài này từng bước. Trước hết hãy chép lại đề theo cách hiểu của bạn, chỉ ra dữ kiện, công thức cần dùng, rồi giải chi tiết. Kết thúc bằng kiểm tra đáp án.",
        },
        {
          label: "Nhiều hướng giải",
          description: "So sánh các cách và nói cách nào dễ hiểu nhất.",
          prompt:
            "Đưa ra nhiều hướng giải cho bài này. Với mỗi hướng, nêu ý tưởng, ưu điểm, nhược điểm, độ dài, rủi ro sai. Sau đó xếp hạng hướng giải tốt nhất cho học sinh.",
        },
        {
          label: "Gợi ý trước",
          description: "Chỉ gợi ý để tự làm, chưa hiện lời giải ngay.",
          prompt:
            "Đừng giải ngay. Hãy đưa 3 mức gợi ý từ nhẹ đến rõ hơn, rồi hỏi tôi muốn xem lời giải đầy đủ chưa.",
        },
        {
          label: "Chữa bài làm",
          description: "Tìm lỗi sai trong bài làm và sửa từng dòng.",
          prompt:
            "Hãy chấm và chữa bài làm tôi gửi. Chỉ ra dòng nào đúng, dòng nào sai, vì sao sai, cách sửa và mẹo tránh lỗi tương tự.",
        },
        {
          label: "Luyện tương tự",
          description: "Tạo thêm bài cùng dạng để luyện sau khi hiểu.",
          prompt:
            "Tạo 5 bài luyện tương tự theo độ khó tăng dần. Mỗi bài có đáp án cuối cùng và gợi ý ngắn, không giải quá dài trừ khi tôi yêu cầu.",
        },
      ],
      promptStarters: [
        {
          label: "Giải bài từ ảnh hoặc file",
          text: "Giải bài trong ảnh/file tôi gửi. Hãy trình bày dễ hiểu cho học sinh và kiểm tra lại đáp án.",
        },
        {
          label: "So sánh các cách giải",
          text: "Bài này có mấy cách giải? Hãy sắp xếp từ dễ hiểu nhất đến tối ưu nhất.",
        },
        {
          label: "Giải thích cho phụ huynh",
          text: "Giải thích bài này theo cách phụ huynh có thể hướng dẫn lại cho con.",
        },
      ],
      reviewChecklist: [
        "Đã chép lại đề đúng ký hiệu chưa?",
        "Có nêu công thức và lý do dùng công thức không?",
        "Có kiểm tra đáp án hoặc thay ngược lại không?",
        "Có chỉ lỗi sai thường gặp và bài luyện tương tự không?",
      ],
    },
    systemPrompt:
      "Bạn là trợ lý học Toán cho học sinh và phụ huynh. Luôn trả lời bằng tiếng Việt, giải thích từng bước, không chỉ đưa đáp án. Trước khi giải, hãy kiểm tra lại đề bài nếu có ký hiệu mơ hồ. Ưu tiên phương pháp dễ hiểu, nêu công thức được dùng, chỉ ra lỗi sai thường gặp và thêm một bài luyện tương tự khi phù hợp. Không làm thay theo kiểu chép đáp án nếu người dùng yêu cầu gian lận; hãy chuyển sang gợi ý học tập.",
  },
};
