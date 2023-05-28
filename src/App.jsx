import * as THREE from "three";
import React, { useMemo, useRef } from "react";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { Box, OrbitControls, Plane } from "@react-three/drei";
import { ChromaticAberrationEffect, CopyPass, EffectComposer, EffectPass, RenderPass, ScanlineEffect } from "postprocessing";

const Scene = () => {
  const { gl, scene, camera } = useThree();

  /**
   * Target camera and scene setup
   */

  const [targetCamera, targetScene] = useMemo(() => {
    const targetScene = new THREE.Scene();

    // Set portal clear colour
    targetScene.background = new THREE.Color("pink");

    return [new THREE.PerspectiveCamera(), targetScene];
  }, []);

  /**
   * Effect composer, fx and render pass setup
   */

  const [composer, targetSavePass] = useMemo(() => {
    const composer = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType,
    });

    targetCamera.position.z = 3;

    const renderPass = new RenderPass(scene, camera);
    const targetRenderPass = new RenderPass(targetScene, targetCamera);
    const targetSavePass = new CopyPass();
    const scan = new ScanlineEffect({ density: 0.5 });
    const chroma = new ChromaticAberrationEffect({ offset: new THREE.Vector2(0.0125, 0.0125) });
    const targetEffectPass = new EffectPass(targetCamera, scan, chroma);

    composer.addPass(targetRenderPass);
    composer.addPass(targetEffectPass);
    composer.addPass(targetSavePass);
    composer.addPass(renderPass);

    return [composer, targetSavePass];
  }, [camera, gl, scene, targetCamera, targetScene]);

  /**
   * Render portal scene
   */

  useFrame((_, delta) => composer.render(delta));

  const boxRef = useRef();
  const boxRef2 = useRef();
  const planeRef = useRef();

  useFrame(() => {
    boxRef.current.rotation.y += 0.02;
    boxRef2.current.rotation.y += 0.02;
  });

  return (
    <>
      {createPortal(
        <>
          <Box ref={boxRef} args={[1, 1, 1]} rotation={[0.5, 0, 0]} position={[0, 0, 0]}>
            <meshNormalMaterial />
          </Box>
        </>,
        targetScene
      )}
      <Plane ref={planeRef} args={[2, 2, 2]} position={[-1, 0, 0]}>
        <meshBasicMaterial map={targetSavePass.renderTarget.texture} />
      </Plane>
      <Box ref={boxRef2} args={[1, 1, 1]} scale={0.5} rotation={[0.5, 0, 0]} position={[1, 0, 0]}>
        <meshNormalMaterial />
      </Box>
    </>
  );
};

const App = () => {
  return (
    <Canvas flat linear camera={{ position: [0, 0, 3] }}>
      <OrbitControls />
      <Scene />
    </Canvas>
  );
};

export default App;
