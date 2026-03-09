import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pb, getFileUrl } from '@/integrations/pocketbase/client';
import type { Tour } from '@/integrations/pocketbase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Upload,
  Trash2,
  Copy,
  Eye,
  LogOut,
  Plus,
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  Trees,
  QrCode,
  Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState<Tour[]>([]);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedTourForQr, setSelectedTourForQr] = useState<Tour | null>(null);

  useEffect(() => {
    if (!pb.authStore.isValid) {
      navigate('/login');
      return;
    }
    setLoading(false);
    fetchTours();
  }, [navigate]);

  const fetchTours = async () => {
    try {
      const records = await pb.collection('tours').getList<Tour>(1, 100, {
        sort: '-id',
      });
      setTours(records.items);
    } catch (err) {
      console.error('Error fetching tours:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const generateSlug = (title: string) => {
    const timestamp = Date.now().toString(36);
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `${slug}-${timestamp}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title) {
      toast.error('กรุณากรอกชื่อและเลือกภาพ');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description || '');
      formData.append('image', selectedFile);
      formData.append('slug', generateSlug(title));
      formData.append('is_active', 'true');
      formData.append('view_count', '0');

      await pb.collection('tours').create(formData);

      toast.success('สร้าง Virtual Tour สำเร็จ!');

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setPreviewUrl(null);

      fetchTours();
    } catch (error: any) {
      console.error('Error creating tour:', error);
      toast.error('เกิดข้อผิดพลาด: ' + (error?.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบ Tour นี้?')) return;

    try {
      await pb.collection('tours').delete(id);
      toast.success('ลบ Tour สำเร็จ');
      fetchTours();
    } catch {
      toast.error('เกิดข้อผิดพลาดในการลบ');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await pb.collection('tours').update(id, { is_active: isActive });
      fetchTours();
      toast.success(isActive ? 'เปิดใช้งานแล้ว' : 'ปิดใช้งานแล้ว');
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    }
  };

  const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

  const copyUrl = (slug: string) => {
    const url = `${siteUrl}/tour/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('คัดลอก URL แล้ว');
  };

  const getTourUrl = (slug: string) => `${siteUrl}/tour/${slug}`;

  const openQrModal = (tour: Tour) => {
    setSelectedTourForQr(tour);
    setQrModalOpen(true);
  };

  const downloadQrCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx?.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.fillStyle = 'white';
      ctx?.fillRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, 512, 512);

      const link = document.createElement('a');
      link.download = `qr-${selectedTourForQr?.slug}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleLogout = () => {
    pb.authStore.clear();
    navigate('/login');
  };

  const getImageUrl = (tour: Tour) =>
    getFileUrl(tour.collectionId, tour.id, tour.image);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Trees className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Evergreen Virtual Tour</h1>
              <p className="text-sm text-muted-foreground">{pb.authStore.record?.email}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            ออกจากระบบ
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create Tour Form */}
          <div className="lg:col-span-1">
            <Card className="glass border-border sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  สร้าง Virtual Tour ใหม่
                </CardTitle>
                <CardDescription>
                  อัพโหลดภาพ 360° (สัดส่วน 2:1) เพื่อสร้าง Tour ใหม่
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">ชื่อ Tour *</Label>
                    <Input
                      id="title"
                      placeholder="เช่น ห้องนั่งเล่น, ห้องนอน"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">รายละเอียด</Label>
                    <Textarea
                      id="description"
                      placeholder="อธิบายเกี่ยวกับ Tour นี้..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>ภาพ 360° *</Label>
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      {previewUrl ? (
                        <div className="space-y-2">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            คลิกเพื่อเลือกภาพ 360°
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ภาพต้องมีสัดส่วน 2:1 (Equirectangular)
                          </p>
                        </div>
                      )}
                    </div>
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-primary"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        กำลังอัพโหลด...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        สร้าง Virtual Tour
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Tours List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Tours ทั้งหมด</h2>
              <span className="text-muted-foreground">{tours.length} รายการ</span>
            </div>

            {tours.length === 0 ? (
              <Card className="glass border-border">
                <CardContent className="py-16 text-center">
                  <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">ยังไม่มี Tour</h3>
                  <p className="text-muted-foreground">
                    เริ่มสร้าง Virtual Tour แรกของคุณ
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tours.map((tour) => (
                  <Card key={tour.id} className="glass border-border overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      {/* Thumbnail */}
                      <div className="sm:w-48 h-32 sm:h-auto flex-shrink-0">
                        <img
                          src={getImageUrl(tour)}
                          alt={tour.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{tour.title}</h3>
                            {tour.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {tour.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {tour.view_count || 0} views
                              </span>
                              <span>
                                {new Date(tour.created).toLocaleDateString('th-TH')}
                              </span>
                            </div>
                          </div>

                          {/* Active Switch */}
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`active-${tour.id}`} className="text-sm">
                              {tour.is_active ? 'เปิด' : 'ปิด'}
                            </Label>
                            <Switch
                              id={`active-${tour.id}`}
                              checked={tour.is_active}
                              onCheckedChange={(checked) => handleToggleActive(tour.id, checked)}
                            />
                          </div>
                        </div>

                        {/* URL & Actions */}
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
                              <LinkIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <code className="text-xs truncate flex-1">
                                /tour/{tour.slug}
                              </code>
                            </div>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => copyUrl(tour.slug)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openQrModal(tour)}
                            title="สร้าง QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => window.open(`/tour/${tour.slug}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(tour.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              QR Code - {selectedTourForQr?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-xl shadow-lg">
              <QRCodeSVG
                id="qr-code-svg"
                value={selectedTourForQr ? getTourUrl(selectedTourForQr.slug) : ''}
                size={256}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-sm text-muted-foreground text-center break-all px-4">
              {selectedTourForQr && getTourUrl(selectedTourForQr.slug)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (selectedTourForQr) {
                    copyUrl(selectedTourForQr.slug);
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                คัดลอก URL
              </Button>
              <Button onClick={downloadQrCode} className="gradient-primary">
                <Download className="w-4 h-4 mr-2" />
                ดาวน์โหลด QR
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
