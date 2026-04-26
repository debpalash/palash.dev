import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PresentationControls, Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

function CoolShape({ color }: { color: string }) {
  const mesh = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * 0.2;
      mesh.current.rotation.y += delta * 0.3;
      
      const scale = hovered ? 1.1 : 1;
      mesh.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={mesh} args={[1.2, 64, 64]} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)}>
        <MeshDistortMaterial 
          color={color} 
          envMapIntensity={1} 
          clearcoat={1} 
          clearcoatRoughness={0.1} 
          metalness={0.8} 
          roughness={0.2} 
          distort={hovered ? 0.4 : 0.2} 
          speed={hovered ? 4 : 2} 
        />
      </Sphere>
    </Float>
  );
}

export default function ProjectCard3D({ project, index }: { project: any, index: number }) {
  const isEven = index % 2 === 0;
  
  // 3D Tilt Effect State
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Give each project a slightly different dark monochrome shade
  const shades = ["#222222", "#333333", "#444444"];
  const shapeColor = shades[index % shades.length];

  return (
    <motion.div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className="flux-glass flux-liquid flux-wet flux-glass-glow"
    >
      <div style={{
        display: 'flex',
        flexDirection: isEven ? 'row' : 'row-reverse',
        alignItems: 'center',
        padding: 'var(--spacing-8)',
        gap: 'var(--spacing-8)',
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        minHeight: '400px'
      }}>
        
        {/* Text Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', transform: 'translateZ(30px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
              <div style={{ fontSize: '2rem', background: 'var(--flux-bg-base)', width: '48px', height: '48px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--flux-glass-border)' }}>
                {project.data.icon}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', fontWeight: 800, margin: 0, color: 'var(--flux-fg-primary)' }}>
                {project.data.name}
              </h3>
            </div>
            <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', background: 'var(--flux-glass-bg)', border: '1px solid var(--flux-glass-border)', color: 'var(--flux-fg-muted)' }}>
              {project.data.status}
            </span>
          </div>
          
          <p style={{ fontSize: 'var(--text-lg)', color: 'var(--flux-fg-secondary)', lineHeight: 1.6, margin: 0 }}>
            {project.data.description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
            {project.data.stack.map((t: string) => (
              <span key={t} style={{ fontSize: 'var(--text-xs)', padding: '4px 8px', background: 'var(--flux-bg-base)', border: '1px solid var(--flux-glass-border)', borderRadius: '4px', color: 'var(--flux-fg-muted)' }}>
                {t}
              </span>
            ))}
          </div>

          {project.data.url && (
            <a href={`/projects/${project.id}`} style={{ marginTop: 'var(--spacing-4)', color: 'var(--flux-accent)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
              → View Project Details
            </a>
          )}
        </div>

        {/* 3D Canvas Side */}
        <div style={{ flex: 1, height: '350px', position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--flux-bg-base)', transform: 'translateZ(40px)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={2} />
            <Environment preset="city" />
            <PresentationControls global rotation={[0, 0, 0]} polar={[-0.4, 0.2]} azimuth={[-1, 0.75]} config={{ mass: 2, tension: 400 }} snap={{ mass: 4, tension: 400 }}>
              <CoolShape color={shapeColor} />
            </PresentationControls>
          </Canvas>
          <div style={{ position: 'absolute', bottom: '10px', left: '0', width: '100%', textAlign: 'center', pointerEvents: 'none', color: 'var(--flux-fg-faint)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
            [ Drag to interact ]
          </div>
        </div>

      </div>
    </motion.div>
  );
}
