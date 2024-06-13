import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { ConfigProvider } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import 'tailwindcss/tailwind.css';
import { Sidebar } from '../components/sidebar';
import background from '../../assets/background-crawl.jpg';
import { CrawlPage } from '../pages/crawl-page';
import { ManageChannel } from '../pages/manage-channel';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        components: {
          Input: {
            activeBorderColor: '#dc2626',
            hoverBorderColor: '#f77c7d',
            activeShadow: '0 0 0 2px #f77c7d42',
          },
          Notification: {
            width: 300,
            fontSize: 12,
            fontSizeIcon: 10,
          },
        },
        token: {
          colorPrimary: '#dc2626',
        },
      }}
    >
      <StyleProvider hashPriority="high">
        <Router>
          <div className="relative h-full flex">
            <Sidebar />
            <Routes>
              <Route path="/" element={<CrawlPage />} />
              <Route path="/manage-channel" element={<ManageChannel />} />
            </Routes>
          </div>
        </Router>
      </StyleProvider>
    </ConfigProvider>
  );
}
