'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ChampionshipTrophy3DProps {
  className?: string
  enableMouseInteraction?: boolean
}

export function ChampionshipTrophy3D({
  className = '',
  enableMouseInteraction = true,
}: ChampionshipTrophy3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene Setup
    const scene = new THREE.Scene()

    // Camera
    const width = container.clientWidth || 400
    const height = container.clientHeight || 450
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000)
    camera.position.set(0, 0.2, 5.8)

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    container.appendChild(renderer.domElement)

    // Trophy Master Group
    const trophyGroup = new THREE.Group()
    trophyGroup.position.y = -0.3
    scene.add(trophyGroup)

    // Materials
    // Premium Gold Metal Material
    const goldMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xf5b700,
      metalness: 0.88,
      roughness: 0.22,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
    })

    // Rich Dark Marble Base Material
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a101d,
      metalness: 0.2,
      roughness: 0.4,
    })

    // Plaque Gold Material
    const plaqueMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.15,
    })

    // 1. Plinth Base (Tiered Dark Marble Pedestal)
    const baseBottomGeo = new THREE.CylinderGeometry(1.2, 1.3, 0.25, 32)
    const baseBottomMesh = new THREE.Mesh(baseBottomGeo, baseMaterial)
    baseBottomMesh.position.y = -1.2
    trophyGroup.add(baseBottomMesh)

    const baseTopGeo = new THREE.CylinderGeometry(0.95, 1.15, 0.4, 32)
    const baseTopMesh = new THREE.Mesh(baseTopGeo, baseMaterial)
    baseTopMesh.position.y = -0.9
    trophyGroup.add(baseTopMesh)

    // Base Gold Ring Accent
    const baseRingGeo = new THREE.TorusGeometry(0.96, 0.04, 16, 64)
    const baseRingMesh = new THREE.Mesh(baseRingGeo, goldMaterial)
    baseRingMesh.rotation.x = Math.PI / 2
    baseRingMesh.position.y = -0.7
    trophyGroup.add(baseRingMesh)

    // 2. Trophy Stem / Waist
    const stemPoints: THREE.Vector2[] = []
    stemPoints.push(new THREE.Vector2(0.4, 0))
    stemPoints.push(new THREE.Vector2(0.22, 0.35))
    stemPoints.push(new THREE.Vector2(0.18, 0.65))
    stemPoints.push(new THREE.Vector2(0.28, 0.95))
    stemPoints.push(new THREE.Vector2(0.65, 1.25))

    const stemGeo = new THREE.LatheGeometry(stemPoints, 32)
    const stemMesh = new THREE.Mesh(stemGeo, goldMaterial)
    stemMesh.position.y = -0.7
    trophyGroup.add(stemMesh)

    // 3. Main Chalice / Cup Body
    const cupPoints: THREE.Vector2[] = []
    cupPoints.push(new THREE.Vector2(0.65, 0))
    cupPoints.push(new THREE.Vector2(0.95, 0.4))
    cupPoints.push(new THREE.Vector2(1.1, 0.9))
    cupPoints.push(new THREE.Vector2(1.15, 1.4))
    cupPoints.push(new THREE.Vector2(1.12, 1.45))
    cupPoints.push(new THREE.Vector2(1.05, 1.4))
    cupPoints.push(new THREE.Vector2(1.0, 0.9))
    cupPoints.push(new THREE.Vector2(0.85, 0.4))
    cupPoints.push(new THREE.Vector2(0.55, 0.05))

    const cupGeo = new THREE.LatheGeometry(cupPoints, 48)
    const cupMesh = new THREE.Mesh(cupGeo, goldMaterial)
    cupMesh.position.y = 0.55
    trophyGroup.add(cupMesh)

    // Cup Rim Gold Crown
    const rimGeo = new THREE.TorusGeometry(1.13, 0.05, 16, 64)
    const rimMesh = new THREE.Mesh(rimGeo, goldMaterial)
    rimMesh.rotation.x = Math.PI / 2
    rimMesh.position.y = 2.0
    trophyGroup.add(rimMesh)

    // 4. Twin Swept Neoclassical Handles
    const handleCurveLeft = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.95, 1.8, 0),
      new THREE.Vector3(-1.75, 1.75, 0),
      new THREE.Vector3(-1.7, 0.75, 0),
      new THREE.Vector3(-0.75, 0.7, 0)
    )
    const handleGeoLeft = new THREE.TubeGeometry(handleCurveLeft, 32, 0.07, 16, false)
    const handleMeshLeft = new THREE.Mesh(handleGeoLeft, goldMaterial)
    trophyGroup.add(handleMeshLeft)

    const handleCurveRight = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.95, 1.8, 0),
      new THREE.Vector3(1.75, 1.75, 0),
      new THREE.Vector3(1.7, 0.75, 0),
      new THREE.Vector3(0.75, 0.7, 0)
    )
    const handleGeoRight = new THREE.TubeGeometry(handleCurveRight, 32, 0.07, 16, false)
    const handleMeshRight = new THREE.Mesh(handleGeoRight, goldMaterial)
    trophyGroup.add(handleMeshRight)

    // 5. Championship Gold Plaque on Pedestal with authentic Turf Titans Engraving
    const plaqueCanvas = document.createElement('canvas')
    plaqueCanvas.width = 1024
    plaqueCanvas.height = 360
    const plaqueCtx = plaqueCanvas.getContext('2d')
    if (plaqueCtx) {
      // Brushed Gold Metal Plaque Background
      const pGrad = plaqueCtx.createLinearGradient(0, 0, 1024, 360)
      pGrad.addColorStop(0, '#e5a900')
      pGrad.addColorStop(0.3, '#ffd700')
      pGrad.addColorStop(0.7, '#f0b800')
      pGrad.addColorStop(1, '#c98a00')
      plaqueCtx.fillStyle = pGrad
      plaqueCtx.fillRect(0, 0, 1024, 360)

      // Outer Engraved Border
      plaqueCtx.strokeStyle = '#5a3d00'
      plaqueCtx.lineWidth = 8
      plaqueCtx.strokeRect(16, 16, 992, 328)

      // Inner Delicate Border
      plaqueCtx.strokeStyle = 'rgba(90, 61, 0, 0.6)'
      plaqueCtx.lineWidth = 3
      plaqueCtx.strokeRect(28, 28, 968, 304)

      // Laser Engraved Deep Bronze/Black Text
      plaqueCtx.fillStyle = '#2a1a00'
      plaqueCtx.textAlign = 'center'
      plaqueCtx.textBaseline = 'middle'

      // Top Line: "★ TURF TITANS ★"
      plaqueCtx.font = '900 64px sans-serif'
      plaqueCtx.letterSpacing = '6px'
      plaqueCtx.fillText('★ TURF TITANS ★', 512, 100)

      // Middle Line: "BOX CRICKET CHAMPIONSHIP"
      plaqueCtx.font = '800 42px sans-serif'
      plaqueCtx.letterSpacing = '3px'
      plaqueCtx.fillStyle = '#3a2600'
      plaqueCtx.fillText('BOX CRICKET CHAMPIONSHIP', 512, 190)

      // Bottom Line: "OFFICIAL WINNERS CUP • 2025"
      plaqueCtx.font = '700 32px sans-serif'
      plaqueCtx.fillStyle = '#4a3200'
      plaqueCtx.fillText('OFFICIAL WINNERS CUP • 2025', 512, 270)
    }

    const plaqueTexture = new THREE.CanvasTexture(plaqueCanvas)
    plaqueTexture.anisotropy = 8

    const plaqueMaterialWithText = new THREE.MeshPhysicalMaterial({
      map: plaqueTexture,
      metalness: 0.85,
      roughness: 0.25,
      clearcoat: 0.6,
    })

    const plaqueGeo = new THREE.BoxGeometry(0.95, 0.32, 0.05)
    
    // Front Plaque
    const plaqueMeshFront = new THREE.Mesh(plaqueGeo, plaqueMaterialWithText)
    plaqueMeshFront.position.set(0, -0.9, 0.98)
    trophyGroup.add(plaqueMeshFront)

    // Back Plaque for 360° visibility
    const plaqueMeshBack = new THREE.Mesh(plaqueGeo, plaqueMaterialWithText)
    plaqueMeshBack.position.set(0, -0.9, -0.98)
    plaqueMeshBack.rotation.y = Math.PI
    trophyGroup.add(plaqueMeshBack)

    // 5B. Laser-Etched Turf Titans Crest on Front and Back of Cup Chalice
    const cupBadgeCanvas = document.createElement('canvas')
    cupBadgeCanvas.width = 512
    cupBadgeCanvas.height = 256
    const cupBadgeCtx = cupBadgeCanvas.getContext('2d')
    if (cupBadgeCtx) {
      cupBadgeCtx.clearRect(0, 0, 512, 256)
      cupBadgeCtx.fillStyle = 'rgba(70, 45, 0, 0.75)'
      cupBadgeCtx.textAlign = 'center'
      cupBadgeCtx.textBaseline = 'middle'
      cupBadgeCtx.font = '900 44px sans-serif'
      cupBadgeCtx.fillText('TURF TITANS', 256, 100)
      cupBadgeCtx.font = '700 24px sans-serif'
      cupBadgeCtx.fillStyle = 'rgba(90, 60, 0, 0.65)'
      cupBadgeCtx.fillText('CHAMPIONS', 256, 160)
    }
    const cupBadgeTexture = new THREE.CanvasTexture(cupBadgeCanvas)
    const cupBadgeMaterial = new THREE.MeshBasicMaterial({
      map: cupBadgeTexture,
      transparent: true,
      opacity: 0.85,
    })
    const cupBadgeGeo = new THREE.PlaneGeometry(0.7, 0.35)

    const cupBadgeFront = new THREE.Mesh(cupBadgeGeo, cupBadgeMaterial)
    cupBadgeFront.position.set(0, 1.25, 1.08)
    trophyGroup.add(cupBadgeFront)

    const cupBadgeBack = new THREE.Mesh(cupBadgeGeo, cupBadgeMaterial)
    cupBadgeBack.position.set(0, 1.25, -1.08)
    cupBadgeBack.rotation.y = Math.PI
    trophyGroup.add(cupBadgeBack)

    // 6. Floating Gold Embers / Sparks
    const sparkCount = 40
    const sparkGeo = new THREE.BufferGeometry()
    const sparkPositions = new Float32Array(sparkCount * 3)
    for (let i = 0; i < sparkCount * 3; i += 3) {
      sparkPositions[i] = (Math.random() - 0.5) * 4.5
      sparkPositions[i + 1] = (Math.random() - 0.5) * 5
      sparkPositions[i + 2] = (Math.random() - 0.5) * 3
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3))
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.045,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    })
    const sparks = new THREE.Points(sparkGeo, sparkMat)
    scene.add(sparks)

    // Lighting (Dramatic Championship Lights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambientLight)

    // Warm Gold Key Light
    const goldKeyLight = new THREE.DirectionalLight(0xfffae6, 3.5)
    goldKeyLight.position.set(4, 5, 5)
    scene.add(goldKeyLight)

    // Cool Arena Fill Light
    const arenaFillLight = new THREE.DirectionalLight(0x74c004, 2.0)
    arenaFillLight.position.set(-4, -2, -2)
    scene.add(arenaFillLight)

    // Back Spotlight
    const backSpot = new THREE.PointLight(0x38bdf8, 2.5, 10)
    backSpot.position.set(0, 3, -3)
    scene.add(backSpot)

    // Initial Angle
    trophyGroup.rotation.y = 0.2

    // Mouse Interaction
    let targetRotY = 0.2
    let mouseX = 0
    let mouseY = 0

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableMouseInteraction) return
      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5
      mouseX = x
      mouseY = y
    }

    if (enableMouseInteraction) {
      window.addEventListener('mousemove', handleMouseMove)
    }

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        const h = entry.contentRect.height
        if (w > 0 && h > 0) {
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
      }
    })
    resizeObserver.observe(container)

    // Animation Loop
    let animationFrameId: number
    const startTime = performance.now()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const elapsedTime = (performance.now() - startTime) / 1000

      // Continuous Slow Rotation
      targetRotY += 0.005

      // Gentle floating sway
      trophyGroup.position.y = -0.3 + Math.sin(elapsedTime * 1.2) * 0.08

      // Smooth mouse interpolation
      trophyGroup.rotation.y += (targetRotY + mouseX * 0.6 - trophyGroup.rotation.y) * 0.05
      trophyGroup.rotation.x = Math.sin(elapsedTime * 0.8) * 0.03 + mouseY * 0.2

      // Sparkle rise
      sparks.rotation.y = elapsedTime * 0.04

      renderer.render(scene, camera)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      if (enableMouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove)
      }
      resizeObserver.disconnect()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      baseBottomGeo.dispose()
      baseTopGeo.dispose()
      baseRingGeo.dispose()
      stemGeo.dispose()
      cupGeo.dispose()
      rimGeo.dispose()
      handleGeoLeft.dispose()
      handleGeoRight.dispose()
      plaqueGeo.dispose()
      plaqueTexture.dispose()
      plaqueMaterialWithText.dispose()
      cupBadgeGeo.dispose()
      cupBadgeTexture.dispose()
      cupBadgeMaterial.dispose()
      sparkGeo.dispose()
      goldMaterial.dispose()
      baseMaterial.dispose()
      sparkMat.dispose()
      renderer.dispose()
    }
  }, [enableMouseInteraction])

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none cursor-grab active:cursor-grabbing ${className}`}
      aria-label="3D Championship Trophy"
    />
  )
}
