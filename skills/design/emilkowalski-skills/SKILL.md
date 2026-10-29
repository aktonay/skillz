---
name: emilkowalski-skills
description: >
  Master skill bundle by Emil Kowalski (Vercel/Linear design engineer) for motion design,
  micro-interactions, animation audits, spring physics, and Apple-grade UI polish.
license: MIT
---

# Skills for Designers and Engineers (Emil Kowalski)

A master suite of guidelines and rules to eliminate generic "AI slop" animations and produce hand-crafted motion quality.

## Included Specialized Skills

- `animate`: Natural spring physics, tailored easing curves, and layout animations.
- `review-animations`: Auditing existing CSS/Framer Motion animations for timing, overshoot, and jank.
- `improve-animations`: Upgrading linear transitions to cohesive fluid motion.
- `animation-vocabulary`: Shared language for choreographed timing, staggers, and damping.
- `apple-design`: Cupertino-style tactile feedback, depth, typography, and rounded rectangles.
- `ask-sonner`: Toast notification patterns and micro-interaction UX.
- `break-ui`: Stress-testing layouts for overflow, responsive constraints, and dynamic content.
- `emil-design-eng`: Full-stack design engineering methodology bridging Figma and React.

## Motion Golden Rules
1. **Never use `ease-in` for entering elements**: Entering elements should decelerate into place (`cubic-bezier(0.16, 1, 0.3, 1)` or spring).
2. **Exiting elements should accelerate away**: Use quick acceleration (`ease-in` or high damping).
3. **Keep durations short**: Micro-interactions must feel instant (150ms–300ms max).
4. **Animate `transform` and `opacity` only**: Never animate `width`, `height`, `top`, or `margin` to prevent layout reflows.
