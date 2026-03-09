import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pb, getFileUrl } from '@/integrations/pocketbase/client';
import type { Tour } from '@/integrations/pocketbase/types';
import PanoramaViewer from '@/components/PanoramaViewer';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TourView = () => {
  const { slug } = useParams<{ slug: string }>();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTour = async () => {
      if (!slug) return;

      try {
        const record = await pb.collection('tours').getFirstListItem<Tour>(
          `slug = "${slug}" && is_active = true`
        );
        setTour(record);

        // Increment view count (non-blocking, ignore errors for public access)
        pb.collection('tours').update(record.id, {
          view_count: (record.view_count || 0) + 1,
        }).catch(() => {});
      } catch {
        setError('ไม่พบ Virtual Tour นี้');
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center glass p-8 rounded-2xl max-w-md mx-4">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😕</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">ไม่พบ Virtual Tour</h1>
          <p className="text-muted-foreground mb-6">Tour ที่คุณกำลังค้นหาอาจถูกลบหรือไม่ได้เปิดใช้งาน</p>
          <Link to="/">
            <Button variant="default" className="gradient-primary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = getFileUrl(tour.collectionId, tour.id, tour.image);

  return (
    <div className="min-h-screen bg-background">
      {/* Panorama Viewer - Full screen */}
      <div className="h-screen">
        <PanoramaViewer imageUrl={imageUrl} title={tour.title} />
      </div>

      {/* Tour Info Overlay */}
      {tour.description && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <div className="glass p-4 rounded-xl max-w-lg animate-fade-in">
            <p className="text-sm text-muted-foreground">{tour.description}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourView;
