import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import UrlAnalysePage from '@/pages/UrlAnalysePage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="url-analyse" element={<UrlAnalysePage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}