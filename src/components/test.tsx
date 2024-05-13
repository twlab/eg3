if (canvasRefR.length > 0) {
  if (canvasRefR[canvasRefR.length - 1].current) {
    let context = canvasRefR[canvasRefR.length - 1].current.getContext('2d');
    for (let i = 0; i < xToFeatureForward[canvasRefR.length - 1].length; i++) {
      // going through width pixels
      // i = canvas pixel xpos
      context.fillStyle = 'blue';
      if (xToFeatureForward[canvasRefR.length - 1][i] !== 0) {
        context.fillRect(
          i,
          xToFeatureForward[canvasRefR.length - 1][i],
          1,
          20 - xToFeatureForward[canvasRefR.length - 1][i]
        );
      }
    }
  }
}
