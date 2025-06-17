import React from 'react';
import './HIVEducation.css';

const HIVEducation = () => {
  return (
    <div className="hiv-education">

      {/* Main Content */}
      <div className="container">
        {/* Sidebar */}
        <aside className="sidebar">
          <h3 className="sidebar-title">Hữu Ích</h3>
          <ul className="resource-list">
            <li><a href="https://vaac.gov.vn" target="_blank" rel="noopener noreferrer">Cục Phòng chống HIV/AIDS Việt Nam</a></li>
            <li><a href="https://www.who.int/hiv/en/" target="_blank" rel="noopener noreferrer">WHO - HIV/AIDS</a></li>
            <li><a href="https://www.unaids.org" target="_blank" rel="noopener noreferrer">UNAIDS</a></li>
            <li><a href="https://www.cdc.gov/hiv" target="_blank" rel="noopener noreferrer">CDC - HIV Basics</a></li>
          </ul>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Basics Section */}
          <section id="basics" className="section">
            <h2>Kiến Thức Cơ Bản Về HIV</h2>
            
            <div className="card">
              <div className="card-header">HIV là gì?</div>
              <div className="card-body">
                <p>HIV (Human Immunodeficiency Virus) là virus gây suy giảm miễn dịch ở người. Khi xâm nhập vào cơ thể, HIV tấn công hệ thống miễn dịch, đặc biệt là tế bào CD4 (tế bào T hỗ trợ), làm suy yếu khả năng chống lại nhiễm trùng và bệnh tật của cơ thể.</p>
                
                <h3>HIV khác AIDS như thế nào?</h3>
                <p>AIDS (Hội chứng suy giảm miễn dịch mắc phải) là giai đoạn cuối của nhiễm HIV, khi hệ miễn dịch đã bị tổn thương nghiêm trọng. Không phải ai nhiễm HIV cũng sẽ tiến triển thành AIDS, nhất là khi được điều trị kịp thời.</p>
                
                <h3>Các giai đoạn nhiễm HIV</h3>
                <ol>
                  <li><strong>Giai đoạn cấp tính:</strong> 2-4 tuần sau khi nhiễm, có thể có triệu chứng giống cúm</li>
                  <li><strong>Giai đoạn không triệu chứng:</strong> Virus nhân lên âm thầm trong nhiều năm</li>
                  <li><strong>Giai đoạn có triệu chứng:</strong> Hệ miễn dịch bắt đầu suy yếu</li>
                  <li><strong>AIDS:</strong> Hệ miễn dịch bị tổn thương nặng</li>
                </ol>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">38.4 triệu</div>
                <div className="stat-label">người sống chung với HIV toàn cầu (2021)</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">85%</div>
                <div className="stat-label">người nhiễm HIV biết tình trạng của mình</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">75%</div>
                <div className="stat-label">người nhiễm HIV được điều trị ARV</div>
              </div>
            </div>
          </section>

          {/* Prevention Section */}
          <section id="prevention" className="section">
            <h2>Phòng Ngừa HIV</h2>
            
            <div className="card">
              <div className="card-header">Các Cách Phòng Ngừa Hiệu Quả</div>
              <div className="card-body">
                <h3>1. Sử dụng bao cao su đúng cách</h3>
                <p>Bao cao su là biện pháp hiệu quả nhất để ngăn ngừa lây nhiễm HIV qua đường tình dục, với hiệu quả lên đến 98% khi sử dụng đúng cách.</p>
                
                <h3>2. Điều trị dự phòng trước phơi nhiễm (PrEP)</h3>
                <p>PrEP là thuốc uống hàng ngày giúp ngăn ngừa lây nhiễm HIV trước khi phơi nhiễm, hiệu quả lên đến 99% khi sử dụng đều đặn.</p>
                
                <h3>3. Không dùng chung bơm kim tiêm</h3>
                <p>Luôn sử dụng bơm kim tiêm mới, vô trùng. Các chương trình trao đổi bơm kim tiêm có sẵn ở nhiều địa phương.</p>
                
                <h3>4. Điều trị ARV cho người nhiễm HIV</h3>
                <p>Người nhiễm HIV đang điều trị ARV và có tải lượng virus dưới ngưỡng phát hiện (U=U) không thể lây truyền HIV qua đường tình dục.</p>
              </div>
            </div>
          </section>

          {/* Treatment Section */}
          <section id="treatment" className="section">
            <h2>Điều Trị HIV</h2>
            
            <div className="card">
              <div className="card-header">Liệu Pháp Kháng Virus (ART)</div>
              <div className="card-body">
                <p>ART (Antiretroviral Therapy) là phương pháp điều trị HIV bằng cách sử dụng kết hợp các loại thuốc kháng virus. ART không chữa khỏi HIV nhưng giúp kiểm soát virus, bảo vệ hệ miễn dịch và ngăn ngừa lây truyền.</p>
                
                <h3>Các loại thuốc ARV chính</h3>
                <ul>
                  <li>Thuốc ức chế men sao chép ngược nucleoside (NRTIs)</li>
                  <li>Thuốc ức chế men sao chép ngược không nucleoside (NNRTIs)</li>
                  <li>Thuốc ức chế protease (PIs)</li>
                  <li>Thuốc ức chế integrase (INSTIs)</li>
                  <li>Thuốc ức chế xâm nhập</li>
                </ul>
                
                <h3>Nguyên tắc điều trị</h3>
                <ol>
                  <li>Điều trị sớm ngay sau khi chẩn đoán</li>
                  <li>Tuân thủ điều trị nghiêm ngặt (≥95% liều thuốc)</li>
                  <li>Theo dõi định kỳ tải lượng virus và tế bào CD4</li>
                  <li>Phối hợp với bác sĩ để xử lý tác dụng phụ</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Testing Section */}
          <section id="testing" className="section">
            <h2>Xét Nghiệm HIV</h2>
            
            <div className="card">
              <div className="card-header">Các Phương Pháp Xét Nghiệm</div>
              <div className="card-body">
                <h3>1. Xét nghiệm kháng thể</h3>
                <p>Phát hiện kháng thể mà cơ thể tạo ra để chống lại HIV. Thời gian cửa sổ: 3-12 tuần.</p>
                
                <h3>2. Xét nghiệm kháng nguyên/kháng thể</h3>
                <p>Phát hiện cả kháng nguyên p24 và kháng thể. Thời gian cửa sổ: 2-6 tuần.</p>
                
                <h3>3. Xét nghiệm NAT</h3>
                <p>Phát hiện trực tiếp virus HIV trong máu. Thời gian cửa sổ: 1-4 tuần.</p>
                
                <h3>Khi nào nên xét nghiệm?</h3>
                <ul>
                  <li>Sau 3-6 tháng kể từ lần có nguy cơ gần nhất</li>
                  <li>Trước khi bắt đầu mối quan hệ mới</li>
                  <li>Phụ nữ trước khi mang thai hoặc trong thai kỳ</li>
                  <li>Người tiêm chích ma túy</li>
                  <li>Người có nhiều bạn tình</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Support Section */}
          <section id="support" className="section">
            <h2>Hỗ Trợ Người Nhiễm HIV</h2>
            
            <div className="card">
              <div className="card-header">Dịch Vụ Hỗ Trợ</div>
              <div className="card-body">
                <h3>1. Tư vấn tâm lý</h3>
                <p>Các trung tâm tư vấn cung cấp hỗ trợ tâm lý cho người nhiễm HIV và gia đình, giúp vượt qua khủng hoảng ban đầu và sống tích cực.</p>
                
                <h3>2. Nhóm hỗ trợ đồng đẳng</h3>
                <p>Các nhóm do chính người sống chung với HIV điều hành, chia sẻ kinh nghiệm và hỗ trợ lẫn nhau.</p>
                
                <h3>3. Hỗ trợ pháp lý</h3>
                <p>Tư vấn về quyền lợi, chống phân biệt đối xử và các vấn đề pháp lý liên quan.</p>
                
                <h3>4. Hỗ trợ y tế</h3>
                <p>Cung cấp thuốc ARV miễn phí, điều trị nhiễm trùng cơ hội và chăm sóc sức khỏe toàn diện.</p>
              </div>
            </div>
          </section>
        </main>
      </div>

      
    </div>
  );
};

export default HIVEducation;