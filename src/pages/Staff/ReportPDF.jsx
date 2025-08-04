import React from "react";
import "./Report.css";

const ReportPDF = React.forwardRef(({
  stats,
  genderData,
  ageGroupData,
  protocolData,
  appointmentsByMonth,
  appointmentsByDoctor,
}, ref) => {
  return (
    <div className="dashReport-container" ref={ref}>
      <div className="dashReport-header">
        <h2>BÁO CÁO HỆ THỐNG</h2>
        <p>Hệ thống Quản lý HIV</p>
      </div>

      <hr />

      <h3>1. Tổng quan thống kê</h3>
      <ul>
        <li>Tổng bệnh nhân: {stats.totalPatients}</li>
        <li>Tổng khám bệnh: {stats.totalExams}</li>
        <li>Tổng hồ sơ y tế: {stats.totalMedicalRecords}</li>
        <li>Tổng phác đồ ARV: {stats.totalArvProtocols}</li>
      </ul>

      <h3>2. Thời gian xuất báo cáo</h3>
      <p>{new Date().toLocaleDateString("vi-VN")}</p>

      <h3>3. Phân Bố Bệnh Nhân Theo Giới Tính</h3>
      <ul>
        {genderData.map((item, index) => (
          <li key={index}>
            {item.gender}: {item.count} (
            {((item.count / stats.totalPatients) * 100).toFixed(1)}%)
          </li>
        ))}
      </ul>

      <h3>4. Phân Bố Bệnh Nhân Theo Nhóm Tuổi</h3>
      <ul>
        {ageGroupData.map((item, index) => (
          <li key={index}>
            {item.ageGroup}: {item.count} (
            {((item.count / stats.totalPatients) * 100).toFixed(1)}%)
          </li>
        ))}
      </ul>

      <h3>5. Thống Kê Phác Đồ ARV</h3>
      <ul>
        {protocolData.map((item, index) => (
          <li key={index}>{item.protocol}: {item.count}</li>
        ))}
      </ul>

      <h3>6. Lịch Hẹn Theo Tháng</h3>
      <table className="dashReport-table">
        <thead>
          <tr>
            <th>Tháng</th>
            <th>Số lịch hẹn</th>
          </tr>
        </thead>
        <tbody>
          {appointmentsByMonth.map((item, index) => (
            <tr key={index}>
              <td>{item.month}</td>
              <td>{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>7. Lịch Hẹn Theo Bác Sĩ</h3>
      <ul>
        {appointmentsByDoctor.map((item, index) => (
          <li key={index}>
            {item.doctor}: {item.count} (
            {(
              (item.count /
                appointmentsByDoctor.reduce((sum, curr) => sum + curr.count, 0)) *
              100
            ).toFixed(1)}%)
          </li>
        ))}
      </ul>

      <div className="dashReport-signature">
        <h3> Ký tên</h3>
        <p>Người phụ trách: __________________________</p>
      </div>
    </div>
  );
});

export default ReportPDF;
