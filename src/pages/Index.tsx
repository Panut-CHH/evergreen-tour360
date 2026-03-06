import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pb, getFileUrl } from '@/integrations/pocketbase/client';
import type { Tour } from '@/integrations/pocketbase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, ArrowRight, Settings, Sparkles, Trees } from 'lucide-react';

const Index = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const records = await pb.collection('tours').getList<Tour>(1, 6, {
          filter: 'is_active = true',
          sort: '-created',
        });
        setTours(records.items);
      } catch (err) {
        console.error('Error fetching tours:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  const getImageUrl = (tour: Tour) =>
    getFileUrl(tour.collectionId, tour.id, tour.image);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-dark" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(152_76%_42%/0.1),transparent_70%)]" />

        <nav className="relative z-10 container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Trees className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Evergreen Virtual Tour</span>
          </div>
          <Link to="/login">
            <Button variant="ghost" className="glass">
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          </Link>
        </nav>

        <div className="relative z-10 container mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm">360° Panoramic Experience</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            สัมผัสประสบการณ์
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-emerald-400">
              Virtual Tour
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in">
            สำรวจทุกมุมของห้องแบบ 360° หมุนดูได้รอบทิศทาง ซูมเข้าดูรายละเอียดได้
            สะดวกสบายผ่าน QR Code
          </p>

          <div className="flex flex-wrap justify-center gap-4 animate-fade-in">
            <Link to="/login">
              <Button size="lg" className="gradient-primary shadow-glow animate-pulse-glow">
                เริ่มสร้าง Tour
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </header>

      {/* Tours Gallery */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Tours ล่าสุด</h2>
            <p className="text-muted-foreground">สำรวจ Virtual Tours ที่น่าสนใจ</p>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass border-border overflow-hidden">
                <div className="aspect-video bg-muted animate-pulse" />
                <CardContent className="p-4">
                  <div className="h-5 bg-muted rounded animate-pulse mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : tours.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour) => (
              <Link key={tour.id} to={`/tour/${tour.slug}`}>
                <Card className="glass border-border overflow-hidden group hover:border-primary/50 transition-all duration-300 hover:shadow-glow">
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={getImageUrl(tour)}
                      alt={tour.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-4 right-4 glass px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Eye className="w-3 h-3" />
                      ดู Tour
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {tour.title}
                    </h3>
                    {tour.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tour.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      {tour.view_count || 0} views
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="glass border-border">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                <Trees className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">ยังไม่มี Virtual Tour</h3>
              <p className="text-muted-foreground mb-6">
                เริ่มสร้าง Virtual Tour แรกของคุณเลย
              </p>
              <Link to="/login">
                <Button className="gradient-primary">
                  สร้าง Tour ใหม่
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔄</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">หมุนดู 360°</h3>
            <p className="text-muted-foreground text-sm">
              ลากเมาส์หรือใช้นิ้วหมุนเพื่อดูได้ทุกมุมของห้อง
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">ซูมเข้าออก</h3>
            <p className="text-muted-foreground text-sm">
              ซูมเข้าดูรายละเอียด หรือซูมออกดูภาพรวม
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 glass rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📱</span>
            </div>
            <h3 className="font-semibold text-lg mb-2">แชร์ง่าย</h3>
            <p className="text-muted-foreground text-sm">
              ได้ URL สำหรับทำ QR Code แปะในหนังสือหรือโบรชัวร์
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 Evergreen Virtual Tour. สร้างด้วย ❤️</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
