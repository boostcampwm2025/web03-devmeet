import HistoryControl from '@/components/workspace/UI/HistoryControl';
import OverlayControl from '@/components/workspace/UI/OverlayControl';
import Sidebar from '@/components/workspace/UI/Sidebar';
import ToolbarManager from '@/components/workspace/UI/ToolbarManager';
import ZoomControls from '@/components/workspace/UI/ZoomControl';

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center">
      <ToolbarManager />
      <Sidebar />
      <HistoryControl />
      <ZoomControls />
      <OverlayControl />
    </div>
  );
}
