import { Routes, Route } from 'react-router-dom'
import { Toaster } from './components/ui/Toaster'
import { Layout } from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import MapDashboard from './pages/MapDashboard'
import IncidentExplorer from './pages/IncidentExplorer'
import EntityGraph from './pages/EntityGraph'
import Timeline from './pages/Timeline'
import CaseBuilder from './pages/CaseBuilder'
import { Settings } from './pages/Settings'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MapDashboard />} />
        <Route path="/classic" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        <Route path="/incidents" element={
          <Layout>
            <IncidentExplorer />
          </Layout>
        } />
        <Route path="/entities" element={
          <Layout>
            <EntityGraph />
          </Layout>
        } />
        <Route path="/timeline" element={
          <Layout>
            <Timeline />
          </Layout>
        } />
        <Route path="/cases" element={
          <Layout>
            <CaseBuilder />
          </Layout>
        } />
        <Route path="/settings" element={
          <Layout>
            <Settings />
          </Layout>
        } />
      </Routes>
      <Toaster />
    </>
  )
}