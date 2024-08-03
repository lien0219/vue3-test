import {
  AnimationClip,
  BooleanKeyframeTrack,
  ColorKeyframeTrack,
  NumberKeyframeTrack,
  Vector3,
  VectorKeyframeTrack,
} from "three";

var fps = 60;
// var extendDuration = 0.25;
var animationEndTime = 0

function modifiedKey(key: any) {
  return key;
}
function createAnimation(recordedData: any, morphTargetDictionary: any, bodyPart: any) {

  if (recordedData.length === 0) return null;
  animationEndTime = recordedData[recordedData.length - 1].time
  const timeArray = new Float32Array(recordedData.length);
  const animationData = Object.keys(morphTargetDictionary).map(() => new Float32Array(recordedData.length));

  let finishedFrames = 0;
  recordedData.forEach((d: any, i: any) => {
    // timeArray[i] = finishedFrames / fps + extendDuration * (finishedFrames / (recordedData.length - 1));
    timeArray[i] = finishedFrames / fps;
    finishedFrames++;

    Object.entries(d.blendshapes).forEach(([key, value]) => {
      const morphTargetIndex = morphTargetDictionary[modifiedKey(key)];
      if (morphTargetIndex !== undefined) {
        if ([
          "eyeLookOutRight",
          "eyeLookOutLeft",
          "eyeLookInRight",
          "eyeLookInLeft",
          "eyeLookDownRight",
          "eyeLookDownLeft",
          "eyeBlinkLeft",
          "eyeBlinkRight",
          "eyeLookUpLeft",
          "eyeLookUpRight",
          "eyeWideLeft",
          "eyeWideRight",
          "mouthFrownLeft",
          "mouthFrownRight",
          "mouthPucker",
          "mouthSmileLeft",
          "mouthSmileRight",
          "mouthDimpleLeft",
          "mouthDimpleRight",
          "mouthStretchLeft",
          "mouthStretchRight",
          "mouthRollLower",
          "mouthPressLeft",
          "mouthPressRight",
          "mouthLowerDownLeft",
          "mouthLowerDownRight",
          "mouthUpperUpLeft",
          "mouthUpperUpRight",
          "noseSneerRight",
          "noseSneerLeft",
          "cheekSquintLeft",
          "cheekSquintRight",
          "cheekSquintLeft",
          "cheekSquintRight",
          "tongueOut",
          "jawLeft",
          "jawRight",
          "mouthClose",
          "browDownLeft",
          "browDownRight",
          "browInnerUp",
          "browOuterUpLeft",
          "browOuterUpRight",
        ].includes(key)) {
          // @ts-ignore
          // value -= 0.01
          // value += 0;
          //  value += 0.1;
        }
        if ([
          "jawOpen"
        ].includes(key)) {
          // @ts-ignore
          // value += 0.1
        }
        if ([
          "mouthRollUpper"
        ].includes(key)) {
          // @ts-ignore
          // value -= 0.2
        }
        // @ts-ignore
        animationData[morphTargetIndex][i] = value;
      }
    });
  });

  // const scaleFactor = animationEndTime / timeArray[timeArray.length - 1];
  // for (let i = 0; i < timeArray.length; i++) {
  //   timeArray[i] *= scaleFactor;
  // }

  const tracks = animationData.map((values, i) => {
    const morphTargetName = Object.keys(morphTargetDictionary)[i];
    return new NumberKeyframeTrack(
      `${bodyPart}.morphTargetInfluences[${morphTargetDictionary[morphTargetName]}]`,
      timeArray,
      values
    );
  });

  const clip = new AnimationClip("animation", -1, tracks);
  return clip;
}

export default createAnimation
