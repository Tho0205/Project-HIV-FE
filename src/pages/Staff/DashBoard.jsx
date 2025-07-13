"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Users, FileText, Activity, Pill, TrendingUp } from "lucide-react";
import {
  getAllPatient,
  getAllExam,
  getAllMedicalRecord,
  getAllArvProtocol,
  getPatietnByGender,
  getProtocolStat,
  getNewUsermonthly,
} from "../../services/DashBoard";
import "./DashBoard.css";
import Sidebar from "../../components/Sidebar/Sidebar";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalExams: 0,
    totalMedicalRecords: 0,
    totalArvProtocols: 0,
  });

  const [genderData, setGenderData] = useState([]);
  const [protocolData, setProtocolData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          patients,
          exams,
          records,
          protocols,
          gender,
          protocolStats,
          monthly,
        ] = await Promise.all([
          getAllPatient(),
          getAllExam(),
          getAllMedicalRecord(),
          getAllArvProtocol(),
          getPatietnByGender(),
          getProtocolStat(),
          getNewUsermonthly(),
        ]);

        setStats({
          totalPatients: patients || 0,
          totalExams: exams || 0,
          totalMedicalRecords: records || 0,
          totalArvProtocols: protocols || 0,
        });

        setGenderData(gender || []);
        setProtocolData(protocolStats || []);
        setMonthlyData(monthly || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

  if (loading) {
    return (
      <div className="dash-container">
        <div className="dash-max-width">
          <div className="dash-header">
            <h1 className="dash-title">Dashboard HIV Management</h1>
            <p className="dash-subtitle">Tổng quan hệ thống quản lý HIV</p>
          </div>
          <div className="dash-loading-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="dash-loading-card">
                <div className="dash-loading-bar dash-loading-bar-wide"></div>
                <div className="dash-loading-bar dash-loading-bar-narrow"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-container">
      <Sidebar active="static" />
      <div className="dash-max-width">
        {/* Header */}
        <div className="dash-header">
          <h1 className="dash-title">Dashboard HIV Management</h1>
          <p className="dash-subtitle">Tổng quan hệ thống quản lý HIV</p>
        </div>

        {/* Stats Cards */}
        <div className="dash-stats-grid">
          <div className="dash-card dash-card-gradient-blue">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Tổng Bệnh Nhân</h3>
              <Users className="dash-card-icon" />
            </div>
            <div className="dash-card-content">
              <div className="dash-card-value">
                {stats.totalPatients.toLocaleString()}
              </div>
              <p className="dash-card-description">
                <TrendingUp className="dash-trend-icon" />
                Đang điều trị
              </p>
            </div>
          </div>

          <div className="dash-card dash-card-gradient-green">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Tổng Khám Bệnh</h3>
              <Activity className="dash-card-icon" />
            </div>
            <div className="dash-card-content">
              <div className="dash-card-value">
                {stats.totalExams.toLocaleString()}
              </div>
              <p className="dash-card-description">
                <TrendingUp className="dash-trend-icon" />
                Lượt khám
              </p>
            </div>
          </div>

          <div className="dash-card dash-card-gradient-purple">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Hồ Sơ Y Tế</h3>
              <FileText className="dash-card-icon" />
            </div>
            <div className="dash-card-content">
              <div className="dash-card-value">
                {stats.totalMedicalRecords.toLocaleString()}
              </div>
              <p className="dash-card-description">
                <TrendingUp className="dash-trend-icon" />
                Hồ sơ
              </p>
            </div>
          </div>

          <div className="dash-card dash-card-gradient-orange">
            <div className="dash-card-header">
              <h3 className="dash-card-title">Phác Đồ ARV</h3>
              <Pill className="dash-card-icon" />
            </div>
            <div className="dash-card-content">
              <div className="dash-card-value">
                {stats.totalArvProtocols.toLocaleString()}
              </div>
              <p className="dash-card-description">
                <TrendingUp className="dash-trend-icon" />
                Phác đồ
              </p>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="dash-charts-grid">
          {/* Gender Distribution */}
          <div className="dash-chart-card">
            <div className="dash-chart-header">
              <h2 className="dash-chart-title">
                Phân Bố Bệnh Nhân Theo Giới Tính
              </h2>
              <p className="dash-chart-description">
                Tỷ lệ nam/nữ trong hệ thống
              </p>
            </div>
            <div className="dash-chart-content">
              <div className="dash-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ gender, count, percent }) =>
                        `${gender}: ${count} (${(percent * 100).toFixed(1)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {genderData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Protocol Statistics */}
          <div className="dash-chart-card">
            <div className="dash-chart-header">
              <h2 className="dash-chart-title">Thống Kê Phác Đồ ARV</h2>
              <p className="dash-chart-description">
                Số lượng sử dụng các phác đồ điều trị
              </p>
            </div>
            <div className="dash-chart-content">
              <div className="dash-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={protocolData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="protocol"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Bar dataKey="count" fill="#3b82f6" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly New Users */}
        <div className="dash-chart-card dash-full-width">
          <div className="dash-chart-header">
            <h2 className="dash-chart-title">
              Xu Hướng Bệnh Nhân Mới Theo Tháng
            </h2>
            <p className="dash-chart-description">
              Số lượng bệnh nhân đăng ký mới hàng tháng
            </p>
          </div>
          <div className="dash-chart-content">
            <div className="dash-chart-container-large">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
