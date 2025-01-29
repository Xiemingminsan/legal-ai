<template>
  <div class="wrapper">
    <div class="dot"></div>
  </div>
</template>

<style scoped>
/* Wrapper for the animation circle */
.wrapper {
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  /* Optional: You can add a border or background to visualize the wrapper */
}

/* Dot (the inner circle) */
.dot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: rgba(189, 195, 199, 1);
  animation-name: effect-3;
  animation-duration: 5s, 2s;
  animation-iteration-count: infinite;
  animation-timing-function: ease, linear;
}

/* Outer ring circle - Before */
.wrapper::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -30px 0 0 -30px;
  /* Center this circle, adjusted for 60px */
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid rgba(189, 195, 199, 0.8);
  opacity: 1;
  animation-name: effect-3, effect-1;
  animation-duration: 5s, 2s;
  animation-iteration-count: infinite;
  animation-timing-function: ease, linear;
}

/* Outer ring circle - After */
.wrapper::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  margin: -30px 0 0 -30px;
  /* Center this circle, adjusted for 60px */
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid rgba(189, 195, 199, 0.8);
  opacity: 1;
  animation-name: effect-3, effect-2;
  animation-duration: 5s, 2s;
  animation-iteration-count: infinite;
  animation-timing-function: ease, linear;
}


/* Keyframe animations */
@keyframes effect-1 {
  0% {
    transform: perspective(1000px) rotate3d(1, 1, 1, 0deg)
  }

  100% {
    transform: perspective(1000px) rotate3d(1, 1, 1, 360deg)
  }
}

@keyframes effect-2 {
  0% {
    transform: perspective(1000px) rotate3d(1, -1, 1, 0deg)
  }

  100% {
    transform: perspective(1000px) rotate3d(1, -1, 1, 360deg)
  }
}

@keyframes effect-3 {

  0%,
  100% {
    opacity: 0;
  }

  25%,
  75% {
    opacity: 1;
  }
}
</style>
