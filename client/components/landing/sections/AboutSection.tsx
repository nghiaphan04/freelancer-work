"use client";

import Link from "next/link";

export default function AboutSection() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Cơ hội ứng tuyển việc làm với đãi ngộ hấp dẫn tại các công ty hàng đầu
        </h2>
        
        {/* Intro Paragraph */}
        <p className="text-gray-700 text-sm leading-relaxed mb-6">
          Trước sự phát triển vượt bậc của nền kinh tế, rất nhiều ngành nghề trở nên khan hiếm nhân lực hoặc thiếu nhân lực giỏi. Vì vậy, hầu hết các trường Đại học đều liên kết với các công ty, doanh nghiệp, cơ quan để tạo cơ hội cho các bạn sinh viên được học tập, rèn luyện bản thân và làm quen với môi trường làm việc từ sớm. Trong{" "}
          <Link href="/jobs" className="text-[#00b14f] font-semibold hover:underline">
            danh sách việc làm
          </Link>{" "}
          trên đây, WorkHub mang đến cho bạn những cơ hội việc làm tại những môi trường làm việc năng động, chuyên nghiệp.
        </p>

        {/* Section: Vậy tại sao nên tìm việc tại WorkHub? */}
        <h3 className="text-base font-bold text-gray-900 mb-3">
          Vậy tại sao nên tìm việc tại WorkHub?
        </h3>

        {/* Sub-section: Việc làm Chất lượng */}
        <h4 className="text-sm font-bold text-gray-800 mb-2">Việc làm Chất lượng</h4>
        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mb-4 ml-2">
          <li>Hàng ngàn tin tuyển dụng chất lượng cao được cập nhật thường xuyên để đáp ứng nhu cầu tìm việc của ứng viên.</li>
          <li>Hệ thống thông minh tự động gợi ý các công việc phù hợp theo CV của bạn.</li>
        </ul>

        {/* Sub-section: Công cụ viết CV đẹp Miễn phí */}
        <h4 className="text-sm font-bold text-gray-800 mb-2">Công cụ viết CV đẹp Miễn phí</h4>
        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mb-4 ml-2">
          <li>Nhiều mẫu CV đẹp, phù hợp nhu cầu ứng tuyển các vị trí khác nhau.</li>
          <li>Tương tác trực quan, dễ dàng chỉnh sửa thông tin, tạo CV online nhanh chóng trong vòng 5 phút.</li>
        </ul>

        {/* Sub-section: Hỗ trợ Người tìm việc */}
        <h4 className="text-sm font-bold text-gray-800 mb-2">Hỗ trợ Người tìm việc</h4>
        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 mb-6 ml-2">
          <li>Nhà tuyển dụng chủ động tìm kiếm và liên hệ với bạn qua hệ thống kết nối ứng viên thông minh.</li>
          <li>Báo cáo chi tiết Nhà tuyển dụng đã xem CV và gửi offer tới bạn.</li>
        </ul>

        {/* Closing Paragraph */}
        <p className="text-gray-700 text-sm leading-relaxed">
          Tại{" "}
          <Link href="/" className="text-[#00b14f] font-semibold hover:underline">
            WorkHub
          </Link>
          , bạn có thể tìm thấy những tin tuyển dụng việc làm với mức lương vô cùng hấp dẫn. Những nhà tuyển dụng kết nối với WorkHub đều là những công ty lớn tại Việt Nam, nơi bạn có thể làm việc trong một môi trường chuyên nghiệp, năng động, trẻ trung. WorkHub là nền tảng tuyển dụng công nghệ cao giúp các nhà tuyển dụng và ứng viên kết nối với nhau. Nhanh tay tạo CV để ứng tuyển vào các vị trí việc làm mới nhất hấp dẫn tại{" "}
          <Link href="/jobs?location=hanoi" className="text-[#00b14f] font-semibold hover:underline">
            việc làm mới nhất tại Hà Nội
          </Link>
          ,{" "}
          <Link href="/jobs?location=hcm" className="text-[#00b14f] font-semibold hover:underline">
            việc làm mới nhất tại TP.HCM
          </Link>
          {" "}ở WorkHub, bạn sẽ tìm thấy những{" "}
          <span className="font-semibold">việc làm mới nhất</span> với mức lương tốt nhất!
        </p>
      </div>
    </section>
  );
}
