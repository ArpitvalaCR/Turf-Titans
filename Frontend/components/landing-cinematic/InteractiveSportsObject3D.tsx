'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface InteractiveSportsObject3DProps {
  className?: string
  enableMouseInteraction?: boolean
}

export function InteractiveSportsObject3D({
  className = '',
  enableMouseInteraction = true,
}: InteractiveSportsObject3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const clickHandlerRef = useRef<() => void>(() => {})

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // -------------------------------------------------------------
    // SCENE & CAMERA SETUP
    // -------------------------------------------------------------
    const scene = new THREE.Scene()

    const width = container.clientWidth || 400
    const height = container.clientHeight || 400
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000)
    camera.position.set(0, 0, 5.8)

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

    // Master interactive stage (handles mouse tilt & idle floating)
    const masterStage = new THREE.Group()
    scene.add(masterStage)

    // Raycaster for precision clicking
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    // -------------------------------------------------------------
    // 1. REALISTIC CRICKET BALL 🏏
    // -------------------------------------------------------------
    const cricketGroup = new THREE.Group()
    masterStage.add(cricketGroup)

    const cricketCanvas = document.createElement('canvas')
    cricketCanvas.width = 2048
    cricketCanvas.height = 1024
    const cCtx = cricketCanvas.getContext('2d')
    if (cCtx) {
      // 4-Piece Alum-Tanned Crimson Leather Gradient
      const grad = cCtx.createLinearGradient(0, 0, 2048, 1024)
      grad.addColorStop(0, '#850b12')
      grad.addColorStop(0.25, '#ab121c')
      grad.addColorStop(0.5, '#930e16')
      grad.addColorStop(0.75, '#ab121c')
      grad.addColorStop(1, '#6b080d')
      cCtx.fillStyle = grad
      cCtx.fillRect(0, 0, 2048, 1024)

      // Quarter-panel seam lines (4-piece cricket ball structure)
      cCtx.strokeStyle = 'rgba(40, 2, 4, 0.45)'
      cCtx.lineWidth = 4
      cCtx.beginPath()
      cCtx.moveTo(0, 512)
      cCtx.lineTo(2048, 512)
      cCtx.moveTo(512, 0)
      cCtx.lineTo(512, 1024)
      cCtx.moveTo(1536, 0)
      cCtx.lineTo(1536, 1024)
      cCtx.stroke()

      // Micro leather pores & surface grain
      for (let i = 0; i < 9000; i++) {
        const x = Math.random() * 2048
        const y = Math.random() * 1024
        const rad = Math.random() * 1.5 + 0.4
        cCtx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'
        cCtx.beginPath()
        cCtx.arc(x, y, rad, 0, Math.PI * 2)
        cCtx.fill()
      }

      // Authentic Gold Foil Stamp on both hemispheres
      const drawCricketStamp = (cx: number, cy: number) => {
        cCtx.save()
        // Concentric Gold Rings
        cCtx.strokeStyle = 'rgba(250, 205, 65, 0.8)'
        cCtx.lineWidth = 3
        cCtx.beginPath()
        cCtx.arc(cx, cy, 140, 0, Math.PI * 2)
        cCtx.stroke()

        cCtx.strokeStyle = 'rgba(255, 225, 90, 0.6)'
        cCtx.lineWidth = 1.5
        cCtx.setLineDash([5, 4])
        cCtx.beginPath()
        cCtx.arc(cx, cy, 128, 0, Math.PI * 2)
        cCtx.stroke()
        cCtx.setLineDash([])

        // Typography
        cCtx.fillStyle = 'rgba(255, 230, 95, 0.98)'
        cCtx.shadowColor = 'rgba(255, 210, 50, 0.6)'
        cCtx.shadowBlur = 10
        cCtx.textAlign = 'center'
        cCtx.textBaseline = 'middle'

        cCtx.font = '900 20px sans-serif'
        cCtx.fillText('★ OFFICIAL MATCH BALL ★', cx, cy - 70)

        cCtx.font = '900 48px sans-serif'
        cCtx.fillText('TURF TITANS', cx, cy - 15)

        cCtx.font = '800 22px sans-serif'
        cCtx.fillStyle = 'rgba(245, 195, 55, 0.9)'
        cCtx.fillText('PRO SEASON SPECIAL', cx, cy + 32)

        cCtx.font = '700 16px sans-serif'
        cCtx.fillStyle = 'rgba(230, 180, 40, 0.75)'
        cCtx.fillText('4-PIECE • ALUM TANNED LEATHER', cx, cy + 68)
        cCtx.restore()
      }

      drawCricketStamp(512, 512)
      drawCricketStamp(1536, 512)
    }

    const cricketTexture = new THREE.CanvasTexture(cricketCanvas)
    const cricketBallGeo = new THREE.SphereGeometry(1.6, 64, 64)
    const cricketBallMat = new THREE.MeshPhysicalMaterial({
      map: cricketTexture,
      roughness: 0.28,
      metalness: 0.1,
      clearcoat: 0.65,
      clearcoatRoughness: 0.22,
      transparent: true,
      opacity: 1,
    })
    const cricketBallMesh = new THREE.Mesh(cricketBallGeo, cricketBallMat)
    cricketGroup.add(cricketBallMesh)

    // Raised equatorial seam
    const cricketSeamGeo = new THREE.TorusGeometry(1.608, 0.045, 16, 120)
    const cricketSeamMat = new THREE.MeshStandardMaterial({
      color: 0xf5f3ea,
      roughness: 0.55,
      transparent: true,
      opacity: 1,
    })
    const cricketSeamMesh = new THREE.Mesh(cricketSeamGeo, cricketSeamMat)
    cricketSeamMesh.rotation.x = Math.PI / 2
    cricketGroup.add(cricketSeamMesh)

    // 96 interlocking cotton stitch ridges
    const stitchesGroup = new THREE.Group()
    const stitchGeo = new THREE.BoxGeometry(0.04, 0.02, 0.08)
    const stitchMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, transparent: true, opacity: 1 })
    for (let i = 0; i < 96; i++) {
      const angle = (i / 96) * Math.PI * 2
      const radius = 1.615
      const stitch = new THREE.Mesh(stitchGeo, stitchMat)
      stitch.position.x = Math.cos(angle) * radius
      stitch.position.z = Math.sin(angle) * radius
      stitch.rotation.y = -angle
      stitch.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.35
      stitchesGroup.add(stitch)
    }
    cricketGroup.add(stitchesGroup)

    // -------------------------------------------------------------
    // 2. REALISTIC 32-PANEL FOOTBALL ⚽
    // -------------------------------------------------------------
    const footballGroup = new THREE.Group()
    footballGroup.scale.set(0.001, 0.001, 0.001)
    footballGroup.visible = false
    masterStage.add(footballGroup)

    const footballCanvas = document.createElement('canvas')
    footballCanvas.width = 2048
    footballCanvas.height = 1024
    const fCtx = footballCanvas.getContext('2d')
    if (fCtx) {
      // White pearl synthetic base
      fCtx.fillStyle = '#f3f6f9'
      fCtx.fillRect(0, 0, 2048, 1024)

      // Micro synthetic dimple texture
      for (let i = 0; i < 15000; i++) {
        const x = Math.random() * 2048
        const y = Math.random() * 1024
        fCtx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.035)' : 'rgba(255,255,255,0.06)'
        fCtx.fillRect(x, y, 1.8, 1.8)
      }

      // 32-Panel Layout (Pentagons in deep carbon & emerald, Hexagons in pearl white)
      const panels = [
        // Front & Back Central Pentagons
        { x: 512, y: 512, r: 145, isPentagon: true },
        { x: 1536, y: 512, r: 145, isPentagon: true },
        // Top & Bottom Pentagons
        { x: 1024, y: 220, r: 130, isPentagon: true },
        { x: 1024, y: 804, r: 130, isPentagon: true },
        { x: 0, y: 220, r: 130, isPentagon: true },
        { x: 2048, y: 220, r: 130, isPentagon: true },
        { x: 0, y: 804, r: 130, isPentagon: true },
        { x: 2048, y: 804, r: 130, isPentagon: true },

        // Surrounding Hexagons
        { x: 256, y: 256, r: 115, isPentagon: false },
        { x: 768, y: 256, r: 115, isPentagon: false },
        { x: 1280, y: 256, r: 115, isPentagon: false },
        { x: 1792, y: 256, r: 115, isPentagon: false },
        { x: 256, y: 768, r: 115, isPentagon: false },
        { x: 768, y: 768, r: 115, isPentagon: false },
        { x: 1280, y: 768, r: 115, isPentagon: false },
        { x: 1792, y: 768, r: 115, isPentagon: false },
        { x: 512, y: 200, r: 105, isPentagon: false },
        { x: 1536, y: 200, r: 105, isPentagon: false },
        { x: 512, y: 824, r: 105, isPentagon: false },
        { x: 1536, y: 824, r: 105, isPentagon: false },
      ]

      panels.forEach((p) => {
        fCtx.save()
        fCtx.translate(p.x, p.y)
        const sides = p.isPentagon ? 5 : 6
        fCtx.beginPath()
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2 - Math.PI / 2
          const px = Math.cos(a) * p.r
          const py = Math.sin(a) * p.r
          if (s === 0) fCtx.moveTo(px, py)
          else fCtx.lineTo(px, py)
        }
        fCtx.closePath()

        if (p.isPentagon) {
          const pGrad = fCtx.createRadialGradient(0, 0, 10, 0, 0, p.r)
          pGrad.addColorStop(0, '#152b14')
          pGrad.addColorStop(0.7, '#0b160b')
          pGrad.addColorStop(1, '#050a05')
          fCtx.fillStyle = pGrad
          fCtx.fill()
        }

        // Stitched Panel Seams
        fCtx.strokeStyle = '#0f172a'
        fCtx.lineWidth = 6
        fCtx.stroke()

        // Inner seam highlight
        fCtx.strokeStyle = 'rgba(255,255,255,0.15)'
        fCtx.lineWidth = 1.5
        fCtx.stroke()
        fCtx.restore()
      })

      // Turf Titans Official Football Branding
      const drawFootballLogo = (cx: number, cy: number) => {
        fCtx.save()
        fCtx.fillStyle = '#74c004'
        fCtx.shadowColor = 'rgba(116, 192, 4, 0.7)'
        fCtx.shadowBlur = 10
        fCtx.textAlign = 'center'
        fCtx.textBaseline = 'middle'
        fCtx.font = '900 32px sans-serif'
        fCtx.fillText('TURF TITANS', cx, cy - 8)
        fCtx.font = '800 15px sans-serif'
        fCtx.fillStyle = '#ffffff'
        fCtx.fillText('OFFICIAL MATCH BALL', cx, cy + 22)
        fCtx.restore()
      }

      drawFootballLogo(512, 512)
      drawFootballLogo(1536, 512)
    }

    const footballTexture = new THREE.CanvasTexture(footballCanvas)
    const footballGeo = new THREE.SphereGeometry(1.65, 64, 64)
    const footballMat = new THREE.MeshPhysicalMaterial({
      map: footballTexture,
      roughness: 0.32,
      metalness: 0.08,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      transparent: true,
      opacity: 1,
    })
    const footballMesh = new THREE.Mesh(footballGeo, footballMat)
    footballGroup.add(footballMesh)

    // -------------------------------------------------------------
    // 3. REALISTIC BADMINTON SHUTTLECOCK 🏸
    // -------------------------------------------------------------
    const badmintonGroup = new THREE.Group()
    badmintonGroup.scale.set(0.001, 0.001, 0.001)
    badmintonGroup.visible = false
    masterStage.add(badmintonGroup)

    // Cork Base (Hemispherical natural cork + leather wrap)
    const corkCanvas = document.createElement('canvas')
    corkCanvas.width = 512
    corkCanvas.height = 256
    const corkCtx = corkCanvas.getContext('2d')
    if (corkCtx) {
      corkCtx.fillStyle = '#f8fafc'
      corkCtx.fillRect(0, 0, 512, 256)
      // Gold Foil Turf Titans Band
      corkCtx.fillStyle = '#eab308'
      corkCtx.fillRect(0, 180, 512, 65)
      corkCtx.fillStyle = '#060b18'
      corkCtx.font = '900 24px sans-serif'
      corkCtx.textAlign = 'center'
      corkCtx.textBaseline = 'middle'
      corkCtx.fillText('TURF TITANS PRO', 256, 212)
    }
    const corkTexture = new THREE.CanvasTexture(corkCanvas)
    const corkGeo = new THREE.SphereGeometry(0.68, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2)
    const corkMat = new THREE.MeshStandardMaterial({
      map: corkTexture,
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.05,
      transparent: true,
      opacity: 1,
    })
    const corkMesh = new THREE.Mesh(corkGeo, corkMat)
    corkMesh.rotation.x = Math.PI
    corkMesh.position.y = -1.15
    badmintonGroup.add(corkMesh)

    // Realistic Feather Skirt (16 individual overlapping goose feather blades with spines)
    const featherCanvas = document.createElement('canvas')
    featherCanvas.width = 128
    featherCanvas.height = 512
    const featherCtx = featherCanvas.getContext('2d')
    if (featherCtx) {
      // Natural feather vane gradient
      featherCtx.fillStyle = '#ffffff'
      featherCtx.fillRect(0, 0, 128, 512)

      // Central Quill Spine
      featherCtx.fillStyle = '#e2e8f0'
      featherCtx.fillRect(60, 0, 8, 512)

      // Delicate feather barbs
      featherCtx.strokeStyle = 'rgba(203, 213, 225, 0.4)'
      featherCtx.lineWidth = 1
      for (let y = 0; y < 512; y += 4) {
        featherCtx.beginPath()
        featherCtx.moveTo(0, y + 10)
        featherCtx.lineTo(60, y)
        featherCtx.moveTo(68, y)
        featherCtx.lineTo(128, y + 10)
        featherCtx.stroke()
      }
    }
    const featherTexture = new THREE.CanvasTexture(featherCanvas)
    const featherMat = new THREE.MeshStandardMaterial({
      map: featherTexture,
      roughness: 0.55,
      metalness: 0.02,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.96,
    })

    const featherGeo = new THREE.PlaneGeometry(0.42, 1.85)
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      const featherMesh = new THREE.Mesh(featherGeo, featherMat)
      const topRadius = 1.3
      const botRadius = 0.58

      featherMesh.position.x = Math.cos(angle) * (topRadius + botRadius) * 0.5
      featherMesh.position.z = Math.sin(angle) * (topRadius + botRadius) * 0.5
      featherMesh.position.y = -0.1
      featherMesh.rotation.y = -angle + 0.32
      featherMesh.rotation.x = 0.32
      badmintonGroup.add(featherMesh)
    }

    // Double Emerald Binding Threads
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x74c004, roughness: 0.45, transparent: true, opacity: 0.95 })
    const ring1Geo = new THREE.TorusGeometry(0.88, 0.024, 16, 64)
    const ring1 = new THREE.Mesh(ring1Geo, ringMat)
    ring1.rotation.x = Math.PI / 2
    ring1.position.y = -0.48
    badmintonGroup.add(ring1)

    const ring2Geo = new THREE.TorusGeometry(1.12, 0.024, 16, 64)
    const ring2 = new THREE.Mesh(ring2Geo, ringMat)
    ring2.rotation.x = Math.PI / 2
    ring2.position.y = 0.18
    badmintonGroup.add(ring2)

    // -------------------------------------------------------------
    // INVISIBLE HIT-BOX FOR EFFORTLESS DIRECT CLICKING
    // -------------------------------------------------------------
    const hitSphereGeo = new THREE.SphereGeometry(2.0, 16, 16)
    const hitSphereMat = new THREE.MeshBasicMaterial({ visible: false })
    const hitSphere = new THREE.Mesh(hitSphereGeo, hitSphereMat)
    masterStage.add(hitSphere)

    // -------------------------------------------------------------
    // LIGHTING (Cinematic Stadium)
    // -------------------------------------------------------------
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xfffaed, 3.5)
    keyLight.position.set(5, 6, 5)
    scene.add(keyLight)

    const turfRimLight = new THREE.DirectionalLight(0x74c004, 2.8)
    turfRimLight.position.set(-5, -4, -2)
    scene.add(turfRimLight)

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2)
    fillLight.position.set(0, -3, 4)
    scene.add(fillLight)

    // -------------------------------------------------------------
    // SEAMLESS TRANSFORMATION ENGINE (~0.95s)
    // -------------------------------------------------------------
    let currentSport = 0 // 0 = Cricket, 1 = Football, 2 = Badminton
    let isTransitioning = false
    let transitionStartTime = 0
    const TRANSITION_DURATION = 0.95
    let fromSport = 0
    let toSport = 0

    const sportGroups = [cricketGroup, footballGroup, badmintonGroup]

    const triggerSportSwitch = () => {
      if (isTransitioning) return
      isTransitioning = true
      transitionStartTime = performance.now() / 1000
      fromSport = currentSport
      toSport = (currentSport + 1) % 3
      currentSport = toSport
    }
    clickHandlerRef.current = triggerSportSwitch

    // Pointer Cursor on Hover
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)

      const intersects = raycaster.intersectObject(hitSphere)
      if (intersects.length > 0) {
        triggerSportSwitch()
      }
    }

    let mouseX = 0
    let mouseY = 0
    let targetRotY = 0.85
    let targetRotX = 0.35

    const handleMouseMove = (e: MouseEvent) => {
      if (!enableMouseInteraction) return
      const rect = container.getBoundingClientRect()
      mouseX = (e.clientX - rect.left) / rect.width - 0.5
      mouseY = (e.clientY - rect.top) / rect.height - 0.5
    }

    renderer.domElement.addEventListener('click', handleCanvasClick)
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

    // -------------------------------------------------------------
    // ANIMATION LOOP
    // -------------------------------------------------------------
    let animationFrameId: number
    const startTime = performance.now()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsedTime = (performance.now() - startTime) / 1000
      const now = performance.now() / 1000

      // Continuous Slow Majestic Rotation
      targetRotY += 0.005

      // Floating Bob
      masterStage.position.y = Math.sin(elapsedTime * 1.5) * 0.12

      // Smooth Mouse Tilt
      masterStage.rotation.y += (targetRotY + mouseX * 0.8 - masterStage.rotation.y) * 0.05
      masterStage.rotation.x += (targetRotX + mouseY * 0.6 - masterStage.rotation.x) * 0.05

      // Smooth Morphing Transition
      if (isTransitioning) {
        const progress = Math.min((now - transitionStartTime) / TRANSITION_DURATION, 1)

        // Smooth cubic ease in-out
        const ease = progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2

        // Fast rotational inertia during switch
        masterStage.rotation.y += Math.sin(progress * Math.PI) * 0.28

        const fromGroup = sportGroups[fromSport]
        const toGroup = sportGroups[toSport]

        fromGroup.visible = true
        toGroup.visible = true

        if (progress < 0.5) {
          // Outgoing Object: Smoothly compresses & scales down
          const outScale = Math.max(1 - ease * 2, 0.001)
          fromGroup.scale.set(outScale, outScale, outScale)
          toGroup.scale.set(0.001, 0.001, 0.001)
        } else {
          // Incoming Object: Smoothly expands from center and settles
          fromGroup.scale.set(0.001, 0.001, 0.001)
          fromGroup.visible = false

          const inScale = Math.min((ease - 0.5) * 2.1, 1.0)
          toGroup.scale.set(inScale, inScale, inScale)
        }

        if (progress >= 1) {
          isTransitioning = false
          fromGroup.visible = false
          fromGroup.scale.set(0.001, 0.001, 0.001)
          toGroup.visible = true
          toGroup.scale.set(1, 1, 1)
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    // -------------------------------------------------------------
    // DISPOSAL & CLEANUP
    // -------------------------------------------------------------
    return () => {
      cancelAnimationFrame(animationFrameId)
      renderer.domElement.removeEventListener('click', handleCanvasClick)
      if (enableMouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove)
      }
      resizeObserver.disconnect()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }

      cricketBallGeo.dispose()
      cricketBallMat.dispose()
      cricketSeamGeo.dispose()
      cricketSeamMat.dispose()
      stitchGeo.dispose()
      stitchMat.dispose()
      cricketTexture.dispose()

      footballGeo.dispose()
      footballMat.dispose()
      footballTexture.dispose()

      corkGeo.dispose()
      corkMat.dispose()
      corkTexture.dispose()
      featherGeo.dispose()
      featherTexture.dispose()
      featherMat.dispose()
      ring1Geo.dispose()
      ring2Geo.dispose()
      ringMat.dispose()

      hitSphereGeo.dispose()
      hitSphereMat.dispose()
      renderer.dispose()
    }
  }, [enableMouseInteraction])

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center cursor-pointer select-none active:scale-[0.98] transition-transform duration-200 ${className}`}
      aria-label="3D Interactive Sports Equipment"
    />
  )
}
