export function noiseAnnotations(noises, at, length) {
    const noiseAnnotations = [];
  
    for (let i = 0; i < noises.length; i++) {
      const startIdx = noises[i].startIndex;
      const endIdx = noises[i].endIndex;
  
      // Case 1: Noise object overlaps with all specified range
      if (startIdx <= at && endIdx >= at + length) {
        noiseAnnotations.push({
          startIndex: at,
          endIndex: at + length
        });
        break;
      }
  
      // Case 2: Noise object end is greater than at+length but start is less than at+length
      if (endIdx > at + length && startIdx < at + length) {
        noiseAnnotations.push({
          startIndex: Math.max(startIdx, at),
          endIndex: at + length
        });
      }
  
      // Case 3: Noise object end is greater than at but start is less than at
      if (endIdx > at && startIdx < at) {
        noiseAnnotations.push({
          startIndex: at,
          endIndex: Math.min(endIdx, at + length)
        });
      }
  
      // Case 4: Noise object start is greater than at and end is less than at+length
      if (startIdx >= at && endIdx <= at + length) {
        noiseAnnotations.push({
          startIndex: startIdx,
          endIndex: endIdx
        });
      }
    }
  
    const noiseVisualAnnotations = noiseAnnotations.map((annotation) => ({
      startIndex: annotation.startIndex - at,
      endIndex: annotation.endIndex - at
    }));
    return (noiseVisualAnnotations)
  }