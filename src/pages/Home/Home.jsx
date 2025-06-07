
import "../Home/Home.css";


const Home = () => {

  return (
    <div className="background">
      <h2 className="doctor-list-title">Danh Sách Bác Sĩ</h2>
      <div className="doctor-list">
        {[1, 2, 3, 4].map((i) => (
          <div className="doctor" key={i}>
            <img src={`/img/doctor${i}.jpg`} alt={`Bác sĩ ${i}`} />
            <div className="doctor-title">Tên bác sĩ {i}</div>
          </div>
        ))}
      </div>

      <div className="app-info">
        <div className="app-info-title">
          Tư vấn sức khỏe từ xa 24/7 qua <br />video & chat
        </div>
        <div className="app-info-underline"></div>
        <p className="app-info-desc">
          Bạn cần sự tư vấn chuyên môn khi gặp các vấn đề sức khỏe? Dù bạn ở đâu hay vào bất cứ lúc
          nào, các bác sĩ chuyên khoa luôn sẵn sàng tư vấn, giải đáp mọi thắc mắc của bạn.
        </p>
        <div className="app-info-actions">
          <div className="action">
            <img src="" alt="Video call" />
            <span>Video call với bác sĩ</span>
          </div>
          <div className="action">
            <img src="" alt="Chat" />
            <span>Chat với bác sĩ</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
