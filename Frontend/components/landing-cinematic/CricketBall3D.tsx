'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface CricketBall3DProps {
  className?: string
  enableMouseInteraction?: boolean
}

export function CricketBall3D({
  className = '',
  enableMouseInteraction = true,
}: CricketBall3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene Setup
    const scene = new THREE.Scene()

    // Camera Setup
    const width = container.clientWidth || 400
    const height = container.clientHeight || 400
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 5.5

    // Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // Ball Group
    const ballGroup = new THREE.Group()
    scene.add(ballGroup)

    // Ball Geometry & Procedural Season Ball Leather Texture
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 1024
    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Base Season Ball Crimson Leather
      const grad = ctx.createLinearGradient(0, 0, 2048, 1024)
      grad.addColorStop(0, '#7a070fff')
      grad.addColorStop(0.3, '#ab121c')
      grad.addColorStop(0.7, '#880c13')
      grad.addColorStop(1, '#6f090e')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 2048, 1024)

      // Micro Leather Grain / Pores
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * 2048
        const y = Math.random() * 1024
        const rad = Math.random() * 1.6 + 0.4
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.06)'
        ctx.beginPath()
        ctx.arc(x, y, rad, 0, Math.PI * 2)
        ctx.fill()
      }

      // Helper function to render authentic Gold Foil Season Ball Stamp on both hemispheres
      const drawSeasonBallStamp = (centerX: number, centerY: number) => {
        ctx.save()

        // Outer Gold Foil Circle Ring
        ctx.strokeStyle = 'rgba(245, 195, 55, 0.75)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(centerX, centerY, 130, 0, Math.PI * 2)
        ctx.stroke()

        // Inner Dotted Ring
        ctx.strokeStyle = 'rgba(255, 220, 80, 0.6)'
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.arc(centerX, centerY, 120, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        // Gold Foil Turf Titans Branding
        ctx.fillStyle = 'rgba(255, 215, 65, 0.95)'
        ctx.shadowColor = 'rgba(255, 200, 40, 0.6)'
        ctx.shadowBlur = 10
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Top Arc Text: "OFFICIAL MATCH BALL"
        ctx.font = '900 20px sans-serif'
        ctx.letterSpacing = '3px'
        ctx.fillText('★ OFFICIAL MATCH BALL ★', centerX, centerY - 65)

        // Main Brand: "TURF TITANS"
        ctx.font = '900 48px sans-serif'
        ctx.fillStyle = 'rgba(255, 230, 100, 1)'
        ctx.fillText('TURF TITANS', centerX, centerY - 15)

        // Sub Brand: "PRO SEASON SPECIAL"
        ctx.font = '800 22px sans-serif'
        ctx.fillStyle = 'rgba(245, 195, 55, 0.9)'
        ctx.fillText('PRO TOURNAMENT SPECIAL', centerX, centerY + 30)

        // Bottom Spec: "4-PIECE • ALUM TANNED"
        ctx.font = '700 16px sans-serif'
        ctx.fillStyle = 'rgba(230, 180, 40, 0.75)'
        ctx.fillText('4-PIECE • ALUM TANNED LEATHER', centerX, centerY + 65)

        ctx.restore()
      }

      // Stamp Hemisphere 1 (x: 512)
      drawSeasonBallStamp(512, 512)

      // Stamp Hemisphere 2 (x: 1536) for 360° visibility
      drawSeasonBallStamp(1536, 512)
    }

    const leatherTexture = new THREE.CanvasTexture(canvas)
    leatherTexture.wrapS = THREE.RepeatWrapping
    leatherTexture.wrapT = THREE.ClampToEdgeWrapping

    const ballGeometry = new THREE.SphereGeometry(1.6, 64, 64)
    const ballMaterial = new THREE.MeshPhysicalMaterial({
      map: leatherTexture,
      color: 0xaa131c,
      roughness: 0.32,
      metalness: 0.12,
      clearcoat: 0.55,
      clearcoatRoughness: 0.25,
    })
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial)
    ballGroup.add(ballMesh)

    // Seam Geometry (Torus along equator)
    const seamGeometry = new THREE.TorusGeometry(1.608, 0.045, 16, 120)
    const seamMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f3ea,
      roughness: 0.6,
      metalness: 0.05,
    })
    const seamMesh = new THREE.Mesh(seamGeometry, seamMaterial)
    seamMesh.rotation.x = Math.PI / 2
    ballGroup.add(seamMesh)

    // Seam Stitch Details (Interlocking micro ridges)
    const stitchesGroup = new THREE.Group()
    const stitchGeo = new THREE.BoxGeometry(0.04, 0.018, 0.07)
    const stitchMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    for (let i = 0; i < 90; i++) {
      const angle = (i / 90) * Math.PI * 2
      const radius = 1.615
      const stitch = new THREE.Mesh(stitchGeo, stitchMat)
      stitch.position.x = Math.cos(angle) * radius
      stitch.position.z = Math.sin(angle) * radius
      stitch.rotation.y = -angle
      stitch.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.35
      stitchesGroup.add(stitch)
    }
    ballGroup.add(stitchesGroup)

    // Ambient Dust / Stadium Floodlight Particles
    const particleCount = 45
    const particleGeo = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 8
      positions[i + 1] = (Math.random() - 0.5) * 8
      positions[i + 2] = (Math.random() - 0.5) * 6
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0x74c004,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // Lighting (Cinematic Floodlights)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    // Key stadium light (top left warm spotlight)
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 3.2)
    keyLight.position.set(5, 6, 5)
    scene.add(keyLight)

    // Turf Green rim light (bottom right neon bounce)
    const turfRimLight = new THREE.DirectionalLight(0x74c004, 2.5)
    turfRimLight.position.set(-5, -4, -2)
    scene.add(turfRimLight)

    // Soft fill blue night light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2)
    fillLight.position.set(0, -3, 4)
    scene.add(fillLight)

    // Initial Angle
    ballGroup.rotation.x = 0.35
    ballGroup.rotation.y = 0.85

    // Mouse Interaction
    let targetRotX = 0.35
    let targetRotY = 0.85
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
    let clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const elapsedTime = clock.getElapsedTime()

      // Continuous Slow Majestic Rotation
      targetRotY += 0.004

      // Gentle Floating Bob
      ballGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.12

      // Smooth Interpolation with Mouse
      ballGroup.rotation.y += (targetRotY + mouseX * 0.8 - ballGroup.rotation.y) * 0.05
      ballGroup.rotation.x += (targetRotX + mouseY * 0.6 - ballGroup.rotation.x) * 0.05

      // Particle Drift
      particles.rotation.y = elapsedTime * 0.03
      particles.rotation.x = Math.sin(elapsedTime * 0.05) * 0.1

      renderer.render(scene, camera)
    }
    animate()

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId)
      if (enableMouseInteraction) {
        window.removeEventListener('mousemove', handleMouseMove)
      }
      resizeObserver.disconnect()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      ballGeometry.dispose()
      ballMaterial.dispose()
      seamGeometry.dispose()
      seamMaterial.dispose()
      stitchGeo.dispose()
      stitchMat.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      leatherTexture.dispose()
      renderer.dispose()
    }
  }, [enableMouseInteraction])

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${className}`}
      aria-label="Interactive 3D Cricket Ball"
    />
  )
}
