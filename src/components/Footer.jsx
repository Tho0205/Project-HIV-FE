import React from "react";
import "./footer.css";
import { useEffect, useState } from "react";
import { getFacilityInfo } from "../services/facilityService";

const Footer = () => {

  const [facilities, setFacilities] = useState([]);

  useEffect(() => {
    getFacilityInfo()
      .then(data => setFacilities(data))
      .catch(err => console.error("Facility load error:", err));
  }, []);

  return (
    <div className="footer">
      <div className="footer-container">
        <a href="https://jiohealth.com/" target="_blank" rel="noopener noreferrer">
          <div className="footer-logo"></div>
        </a>
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-item">
              <div className="footer-title">Hotline</div>
              <div className="footer-info">0123456789</div>
            </div>
            <div className="footer-item">
              <div className="footer-title">Hỗ trợ</div>
              <div className="footer-info">
                <a href="mailto:support@jiohealth.com" target="_blank" rel="noopener noreferrer">
                  4tk@team.com
                </a>
              </div>
            </div>
            <div className="footer-info copyright">
              Copyright © 2017-2025 Rai and Rohl Technologies, Inc. All rights<br />
              reserved.
            </div>
          </div>

          <div className="footer-section">
            <div className="footer-title">Dịch vụ</div>
            <div className="footer-link">
              <a href="#">Hẹn Bác Sĩ, Điều Dưỡng<br />Đến Nhà</a>
            </div>
            <div className="footer-link">
              <a href="#">Nhà Thuốc Trực Tuyến</a>
            </div>
          </div>

          <div className="footer-section">
            <div className="footer-title">Tìm Hiểu Thêm</div>
            <div className="footer-link"><a href="#">Đội Ngũ Bác Sĩ</a></div>
            <div className="footer-link"><a href="#">Dịch Vụ</a></div>
            <div className="footer-link"><a href="#">Báo Chí</a></div>
            <div className="footer-link"><a href="#">Tuyển Dụng</a></div>
          </div>

          <div className="footer-section">
            <div className="footer-title">Hỗ Trợ Khách Hàng</div>
            <div className="footer-link"><a href="#">Câu Hỏi Thường Gặp</a></div>
            <div className="footer-link"><a href="#">Chính Sách Bảo Mật</a></div>
            <div className="footer-link"><a href="#">Chính Sách Hoạt Động</a></div>
            <div className="footer-link"><a href="#">Giải Quyết Khiếu Nại</a></div>
          </div>


          <div className="footer-section">
            <a href="#">
              <div className="footer-bocong"></div>
            </a>
          </div>
          
          <div className="footer-section">
            <div className="footer-title">Cơ Sở Y Tế</div>
            {facilities.map((f) => (
              <div key={f.facilityId} className="footer-facility">
                <p><strong>{f.name}</strong></p>
                <p>{f.address}</p>
                <p>{f.phone}</p>
                <p>{f.email}</p>  
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
