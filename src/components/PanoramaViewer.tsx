import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Loader2, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PanoramaViewerProps {
  imageUrl: string;
  title?: string;
}

const PanoramaViewer = ({ imageUrl, title }: PanoramaViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sphereRef = useRef<THREE.Mesh | null>(null);
  const isUserInteracting = useRef(false);
  const onPointerDownMouseX = useRef(0);
  const onPointerDownMouseY = useRef(0);
  const lon = useRef(180);
  const lat = useRef(0);
  const onPointerDownLon = useRef(0);
  const onPointerDownLat = useRef(0);
  const fov = useRef(100);

  useEffect(() => {
    if (!containerRef.current || !imageUrl) return;

    setIsLoading(true);

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(100, width / height, 1, 1100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create sphere geometry
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); // Flip inside out

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const sphere = new THREE.Mesh(geometry, material);
        sphereRef.current = sphere;
        scene.add(sphere);
        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error('Error loading panorama:', error);
        setIsLoading(false);
      }
    );

    // Event handlers
    const onPointerDown = (event: PointerEvent) => {
      isUserInteracting.current = true;
      onPointerDownMouseX.current = event.clientX;
      onPointerDownMouseY.current = event.clientY;
      onPointerDownLon.current = lon.current;
      onPointerDownLat.current = lat.current;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isUserInteracting.current) return;
      lon.current = (onPointerDownMouseX.current - event.clientX) * 0.1 + onPointerDownLon.current;
      lat.current = (event.clientY - onPointerDownMouseY.current) * 0.1 + onPointerDownLat.current;
    };

    const onPointerUp = () => {
      isUserInteracting.current = false;
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const newFov = fov.current + event.deltaY * 0.05;
      fov.current = THREE.MathUtils.clamp(newFov, 30, 100);
      if (cameraRef.current) {
        cameraRef.current.fov = fov.current;
        cameraRef.current.updateProjectionMatrix();
      }
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        isUserInteracting.current = true;
        onPointerDownMouseX.current = event.touches[0].clientX;
        onPointerDownMouseY.current = event.touches[0].clientY;
        onPointerDownLon.current = lon.current;
        onPointerDownLat.current = lat.current;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!isUserInteracting.current || event.touches.length !== 1) return;
      lon.current = (onPointerDownMouseX.current - event.touches[0].clientX) * 0.1 + onPointerDownLon.current;
      lat.current = (event.touches[0].clientY - onPointerDownMouseY.current) * 0.1 + onPointerDownLat.current;
    };

    const onTouchEnd = () => {
      isUserInteracting.current = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchmove', onTouchMove);
    container.addEventListener('touchend', onTouchEnd);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      lat.current = Math.max(-85, Math.min(85, lat.current));
      const phi = THREE.MathUtils.degToRad(90 - lat.current);
      const theta = THREE.MathUtils.degToRad(lon.current);

      const x = 500 * Math.sin(phi) * Math.cos(theta);
      const y = 500 * Math.cos(phi);
      const z = 500 * Math.sin(phi) * Math.sin(theta);

      camera.lookAt(x, y, z);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      
      if (rendererRef.current && container.contains(rendererRef.current.domElement)) {
        container.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, [imageUrl]);

  const handleZoomIn = () => {
    fov.current = Math.max(30, fov.current - 10);
    if (cameraRef.current) {
      cameraRef.current.fov = fov.current;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const handleZoomOut = () => {
    fov.current = Math.min(100, fov.current + 10);
    if (cameraRef.current) {
      cameraRef.current.fov = fov.current;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleReset = () => {
    lon.current = 180;
    lat.current = 0;
    fov.current = 100;
    if (cameraRef.current) {
      cameraRef.current.fov = fov.current;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-background">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">กำลังโหลด Virtual Tour...</p>
          </div>
        </div>
      )}

      {/* Title overlay */}
      {title && !isLoading && (
        <div className="absolute top-4 left-4 right-16 z-10 glass px-4 py-2 rounded-lg animate-fade-in">
          <h2 className="text-lg font-semibold truncate">{title}</h2>
        </div>
      )}

      {/* Controls */}
      {!isLoading && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 animate-fade-in">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomIn}
            className="glass hover:bg-primary/20"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleZoomOut}
            className="glass hover:bg-primary/20"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleReset}
            className="glass hover:bg-primary/20"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleFullscreen}
            className="glass hover:bg-primary/20"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Help text */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4 z-10 glass px-3 py-1.5 rounded-lg text-xs text-muted-foreground animate-fade-in">
          ลากเมาส์เพื่อหมุนดู • เลื่อนเพื่อซูม
        </div>
      )}

      {/* Viewer container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};

export default PanoramaViewer;
