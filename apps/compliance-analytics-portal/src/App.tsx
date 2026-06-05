import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { DutyOfCarePage } from './pages/DutyOfCarePage';
import { EngagementPage } from './pages/EngagementPage';
import { EscalationsPage } from './pages/EscalationsPage';

export function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/analytics/opportunities" replace />} />
          <Route path="/analytics/opportunities" element={<OpportunitiesPage />} />
          <Route path="/analytics/duty-of-care" element={<DutyOfCarePage />} />
          <Route path="/analytics/engagement" element={<EngagementPage />} />
          <Route path="/analytics/escalations" element={<EscalationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
