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

function Carousel({ projects }: { projects: Product[] }) {
  const scroll = useScroll();
  const groupRef = useRef<THREE.Group>(null);
  
  // Calculate a dynamic radius based on the number of projects
  const count = projects.length;
  // Make the radius big enough so 380px wide cards don't overlap too much
  // Circumference = 2 * PI * R
  const radius = Math.max(3.5, count * 1.0); 

  useFrame((state, delta) => {
    if (groupRef.current) {
      // scroll.offset is 0 to 1
      const targetRotation = scroll.offset * Math.PI * 2;
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetRotation,
        4,
        delta
      );
    }
  });

  return (
    <group ref={groupRef}>
      {projects.map((p, i) => {
        // Position on a circle
        const angle = (i / count) * Math.PI * 2;
        // Shift rotation by -PI/2 so the first item faces the camera
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        return (
          <group key={p.id} position={[x, 0, z]} rotation={[0, angle, 0]}>
            <Html transform occlude wrapperClass="r3f-html-wrapper" distanceFactor={8} zIndexRange={[100, 0]}>
              <a 
                href={`/projects/${p.id}`} 
                className="flux-glass flux-liquid flux-wet flux-glass-glow"
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 'var(--spacing-6)',
                  overflow: 'hidden',
                  width: '380px',
                  height: '420px',
                  textDecoration: 'none',
                  color: 'inherit',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                    <div style={{ fontSize: '2rem', background: 'var(--flux-bg-base)', width: '48px', height: '48px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--flux-glass-border)' }}>
                      {p.data.icon}
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--flux-fg-primary)', margin: 0 }}>
                      {p.data.name}
                    </h3>
                  </div>
                </div>
                
                <p style={{ fontSize: 'var(--text-base)', color: 'var(--flux-fg-secondary)', marginBottom: 'var(--spacing-4)', flexGrow: 1, lineHeight: 1.6 }}>
                  {p.data.description}
                </p>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>
                  {p.data.stack.map((t) => (
                    <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', padding: 'var(--spacing-1) var(--spacing-2)', borderRadius: 'var(--radius-sm)', background: 'var(--flux-bg-base)', color: 'var(--flux-fg-muted)', border: '1px solid var(--flux-glass-border)' }}>
                      {t}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 'var(--spacing-4)', borderTop: '1px solid var(--flux-glass-border)' }}>
                   <span style={{ 
                     display: 'inline-flex',
                     alignItems: 'center',
                     padding: 'var(--spacing-0_5) var(--spacing-2)',
                     borderRadius: 'var(--radius-full)',
                     fontFamily: 'var(--font-mono)',
                     fontSize: 'var(--text-xs)',
                     fontWeight: 500,
                     letterSpacing: '0.02em',
                     textTransform: 'uppercase',
                     color: statusVariant[p.data.status] || 'var(--flux-fg-muted)',
                     backgroundColor: 'var(--flux-glass-bg)',
                     border: '1px solid var(--flux-glass-border)'
                   }}>
                     {p.data.status}
                   </span>
                   {p.data.url && (
                     <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--flux-accent)', textDecoration: 'none' }}>→ view</span>
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
    <div style={{ width: '100%', height: 'calc(100vh - 200px)', minHeight: '600px', cursor: 'grab' }}>
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
        {/* We use ScrollControls to map scrolling to the carousel rotation */}
        <ScrollControls pages={projects.length} infinite damping={0.1}>
          <Carousel projects={projects} />
        </ScrollControls>
      </Canvas>
    </div>
  );
}
