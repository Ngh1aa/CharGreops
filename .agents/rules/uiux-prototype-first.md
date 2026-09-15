# UI/UX PROTOTYPE-FIRST MASTER PROMPT

GitHub + @Tìm kiếm trên mạng
Sử dụng UIUX Factory + toàn bộ skills_UIUX phù hợp trong repository:
https://github.com/Ngh1aa/uiux-ai-workspace (và local `c:\Users\LENOVO\Documents\GitHub\skills_UIUX`)
để redesign project được chỉ định thành một portfolio-grade UI/UX prototype có visual mạnh, interaction tốt và độ hoàn thiện cao.

---

## MỤC TIÊU TỐI CAO
Mục tiêu số 1 là:
Prototype phải đẹp, có art direction rõ, nhìn chuyên nghiệp, có character riêng và tạo ấn tượng mạnh với recruiter ngay trong vài giây đầu.
Đây là một UI/UX portfolio project, không phải bài tập software engineering.
Tập trung gần như hoàn toàn vào những gì người dùng hoặc recruiter thực sự nhìn thấy và tương tác được.
Không dành nhiều thời gian cho: documentation, report, process artifact, architecture document, engineering artifact, exhaustive QA, backend/infrastructure không ảnh hưởng UI.
Nếu một công việc không cải thiện trực tiếp giao diện, trải nghiệm, interaction hoặc chất lượng prototype, mặc định ưu tiên thấp hoặc bỏ qua.

---

## NGUYÊN TẮC LÀM VIỆC
**Ưu tiên thời gian:**
- 75% — Visual design + implementation
- 20% — Visual QA + refinement
- 5% — Research + documentation
Khi phải lựa chọn giữa viết thêm documentation và làm prototype đẹp hơn → luôn chọn làm prototype đẹp hơn.

---

### 1. QUICK PROJECT AUDIT
Xem project hiện tại đủ để hiểu cấu trúc page, navigation, component chính, visual direction, assets, responsive behavior. Không viết audit dài.

### 2. FAST VISUAL RESEARCH
Tối đa 3–5 benchmark tốt nhất. Nhìn → hiểu pattern tốt → chốt direction → bắt đầu thiết kế. Không làm competitor matrix dài hay SWOT.

### 3. CHỐT ART DIRECTION TRƯỚC KHI CODE
Chốt nhanh: 3 Visual adjectives, Color palette, Typography, Layout, Visual signature, Image direction, Motion direction, Anti-template rules. Sau khi chốt direction, bắt đầu implementation ngay.

### 4. REDESIGN TRỰC TIẾP
Ưu tiên màn hình có tác động lớn nhất: Homepage / Hero (gây ấn tượng wow trong 5 giây đầu), Navigation, Primary user flow, Main product/content pages, Detail pages, Conversion screens. Realistic content, zero lorem ipsum.

### 5. DESKTOP-FIRST, SAU ĐÓ RESPONSIVE
Desktop-first tận dụng canvas lớn. Sau đó reflow responsive sang 1440px, 1024px, 768px. Responsive là reflow, không chỉ là shrink.

### 6. DESIGN SYSTEM — CHỈ LÀM VỪA ĐỦ
Đảm bảo tính nhất quán (color, typography, spacing, buttons, inputs, cards, borders, states). Không tốn công tạo page design system riêng nếu không phục vụ portfolio.

### 7. MOTION & INTERACTION
Motion có chủ đích: hero entrance, hover states, transitions, micro-interactions. Premium, smooth, mượt mà, hỗ trợ prefers-reduced-motion.

### 8. VISUAL QA BẰNG SCREENSHOT THẬT
Visual QA chụp screenshot ở 1440, 1024, 768. Đánh giá như một designer và sửa trực tiếp: screenshot → visual critique → sửa → screenshot lại.

### 9. TECHNICAL QA — CHỈ MỨC CẦN THIẾT
Đảm bảo prototype chạy mượt, không vỡ layout, navigation và interaction mượt mà.

### 10. NHỮNG VIỆC KHÔNG LÀM
Không tốn thời gian làm tài liệu lý thuyết, persona dài dòng, architecture report, hay refactor backend thừa thãi.

### 11. PERFORMANCE QUÁ TRÌNH LÀM VIỆC
Chia batch nhỏ, inspect đúng file → redesign → implement → screenshot → repair.

### 12. QUALITY BAR
Chỉ dừng lại khi prototype đạt: intentional, polished, premium, cohesive, distinctive, portfolio-ready. Khiến recruiter ấn tượng trong 5–10 giây đầu.

### 13. GIT WORKFLOW — TỰ ĐỘNG HOÀN TẤT
Làm xong → commit → merge main → push main mà không cần dừng lại hỏi xác nhận.

### 14. THÔNG BÁO KHI HOÀN THÀNH
Thông báo ngắn gọn: Đã hoàn thành, đã merge main, link demo/live, các màn chính đã làm.
