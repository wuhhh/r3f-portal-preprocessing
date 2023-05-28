import * as THREE from "three";
import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { Box, OrbitControls, Plane } from "@react-three/drei";
import { CopyPass, EffectComposer, EffectPass, GlitchEffect, RenderPass } from "postprocessing";

const Scene = () => {
  const { gl, scene, size, camera } = useThree();

  /**
   * Target camera and scene setup
   */

  const [targetCamera, targetScene] = useMemo(() => {
    const targetScene = new THREE.Scene();
    // ...maybe set background?
    targetScene.background = new THREE.Color("black");

    return [new THREE.PerspectiveCamera(), targetScene];
  }, []);

  /**
   * Effect composer, fx and render pass setup
   */

  const [composer, targetSavePass] = useMemo(() => {
    const composer = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType,
    });

    const renderPass = new RenderPass(scene, camera);
    const targetRenderPass = new RenderPass(targetScene, targetCamera);
    const targetSavePass = new CopyPass();
    const glitch = new GlitchEffect();
    const targetGlitchPass = new EffectPass(targetCamera, glitch);

    composer.addPass(targetRenderPass);
    composer.addPass(targetGlitchPass);
    composer.addPass(targetSavePass);
    composer.addPass(renderPass);

    return [composer, targetSavePass];
  }, [camera, gl, scene, targetCamera, targetScene]);

  /**
   * Auto resize composer scene I think? Maybe?
   */

  useEffect(() => void composer.setSize(size.width, size.height), [composer, size, targetScene]);

  /**
   * Render composer scene (?)
   */

  useFrame((_, delta) => void composer.render(delta), 1);

  /**
   * Animate target camera position
   */

  useFrame(state => {
    targetCamera.position.z = 15 + Math.sin(state.clock.getElapsedTime()) * 10;
  });

  const boxRef = useRef();
  const planeRef = useRef();

  useFrame((state, delta) => {
    boxRef.current.rotation.y += 0.02;
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
      <Plane ref={planeRef} args={[2, 2, 2]} position={[0, 0, 0]}>
        <meshBasicMaterial map={targetSavePass.renderTarget.texture} />
      </Plane>
    </>
  );
};

const App = () => {
  return (
    <Canvas camera={{ fov: 70, position: [0, 0, 3] }}>
      <OrbitControls />
      <Scene />
    </Canvas>
  );
};

export default App;
