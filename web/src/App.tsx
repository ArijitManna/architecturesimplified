import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { HomePage } from './pages/HomePage';
import { TopicsPage } from './pages/TopicsPage';
import { TopicDetailPage } from './pages/TopicDetailPage';
import { LearningPathsPage } from './pages/LearningPathsPage';
import { LearningPathDetailPage } from './pages/LearningPathDetailPage';
import { ChallengesPage } from './pages/ChallengesPage';
import { ChallengeDetailPage } from './pages/ChallengeDetailPage';
import { SearchPage } from './pages/SearchPage';
import { AdminLayout } from './admin/AdminLayout';
import { LoginPage } from './admin/pages/LoginPage';
import { DashboardPage } from './admin/pages/DashboardPage';
import { CategoriesPage } from './admin/pages/CategoriesPage';
import { AdminTopicsPage } from './admin/pages/TopicsPage';
import { TopicEditorPage } from './admin/pages/TopicEditorPage';
import { LearningPathsAdminPage } from './admin/pages/LearningPathsAdminPage';
import { ChallengesAdminPage } from './admin/pages/ChallengesAdminPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />
            <Route path="topics" element={<TopicsPage />} />
            <Route path="learning-paths" element={<LearningPathsPage />} />
            <Route path="learning-paths/:slug" element={<LearningPathDetailPage />} />
            <Route path="challenges" element={<ChallengesPage />} />
            <Route path="challenges/:slug" element={<ChallengeDetailPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path=":categorySlug/:topicSlug" element={<TopicDetailPage />} />
          </Route>

          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="topics" element={<AdminTopicsPage />} />
            <Route path="topics/new" element={<TopicEditorPage />} />
            <Route path="topics/:id" element={<TopicEditorPage />} />
            <Route path="learning-paths" element={<LearningPathsAdminPage />} />
            <Route path="challenges" element={<ChallengesAdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
