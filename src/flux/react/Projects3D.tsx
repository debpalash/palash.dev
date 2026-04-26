import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, ScrollControls, useScroll } from '@react-three/drei';
import * as THREE from 'three';

interface Product {
  id: string;
  data: {
    name: string;
    tagline: string;
    description: string;
    url?: string;
    icon: string;
    status: string;
    stack: string[];
  };
}

interface Projects3DProps {
  projects: Product[];
}

const statusVariant: Record<string, string> = {
  live: 'var(--flux-success)',
  beta: 'var(--flux-info)',
  'coming-soon': 'var(--flux-warning)',
};

function Slider({ projects }: { projects: Product[] }) {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  
  const count = projects.length;
  const gap = 15; // Distance between items on X axis

  useFrame((state, delta) => {
    if (groupRef.current) {
      // scroll.offset is 0 to 1
      const targetX = -(scroll.offset * (count - 1) * gap);
      // Optional: add a slight rotation or tilt as we scroll for that 3D feel
      // but keeping it mostly horizontal
      groupRef.current.position.x = THREE.MathUtils.damp(
        groupRef.current.position.x,
        targetX,
        4,
        delta
      );
    }
  });

  return (
    <group ref={groupRef}>
      {projects.map((p, i) => {
        const x = i * gap;

        return (
          <group key={p.id} position={[x, 0, 0]}>
            {/* increase distanceFactor to map large CSS to the view */}
            <Html transform occlude wrapperClass="r3f-html-wrapper" distanceFactor={12} zIndexRange={[100, 0]}>
              <a 
                href={`/projects/${p.id}`} 
                className="flux-glass flux-liquid flux-wet flux-glass-glow"
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 'var(--spacing-12)',
                  overflow: 'hidden',
                  width: '90vw',
                  height: '85vh',
                  textDecoration: 'none',
                  color: 'inherit',
                  userSelect: 'none',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '5rem', background: 'var(--flux-bg-base)', width: '120px', height: '120px', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--flux-glass-border)', marginBottom: 'var(--spacing-8)' }}>
                  {p.data.icon}
                </div>
                
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(3rem, 6vw, 6rem)', fontWeight: 800, color: 'var(--flux-fg-primary)', margin: '0 0 var(--spacing-6) 0', lineHeight: 1.1 }}>
                  {p.data.name}
                </h3>
                
                <p style={{ fontSize: 'clamp(1.2rem, 2vw, 2rem)', color: 'var(--flux-fg-secondary)', marginBottom: 'var(--spacing-8)', maxWidth: '40ch', lineHeight: 1.6 }}>
                  {p.data.description}
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-8)' }}>
                  {p.data.stack.map((t) => (
                    <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(0.8rem, 1.5vw, 1.2rem)', padding: 'var(--spacing-2) var(--spacing-4)', borderRadius: 'var(--radius-md)', background: 'var(--flux-bg-base)', color: 'var(--flux-fg-muted)', border: '1px solid var(--flux-glass-border)' }}>
                      {t}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-6)', marginTop: 'auto' }}>
                   <span style={{ 
                     display: 'inline-flex',
                     alignItems: 'center',
                     padding: 'var(--spacing-2) var(--spacing-4)',
                     borderRadius: 'var(--radius-full)',
                     fontFamily: 'var(--font-mono)',
                     fontSize: '1rem',
                     fontWeight: 500,
                     letterSpacing: '0.05em',
                     textTransform: 'uppercase',
                     color: statusVariant[p.data.status] || 'var(--flux-fg-muted)',
                     backgroundColor: 'var(--flux-glass-bg)',
                     border: '1px solid var(--flux-glass-border)'
                   }}>
                     {p.data.status}
                   </span>
                   {p.data.url && (
                     <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', color: 'var(--flux-accent)', textDecoration: 'none' }}>→ view project</span>
                   )}
                </div>
              </a>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export default function Projects3D({ projects }: Projects3DProps) {
  return (
    <div style={{ width: '100%', height: '100vh', cursor: 'grab' }}>
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
        <ScrollControls pages={projects.length} infinite damping={0.1}>
          <Slider projects={projects} />
        </ScrollControls>
      </Canvas>
    </div>
  );
}
