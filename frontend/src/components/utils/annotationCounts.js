export function annotationCounts(annotations) {

    const annotation_counts = {"N": 0, "U": 0, "S": 0, "V": 0}

    for (let i = 0; i < annotations.length; i++) {
    const annotation = annotations[i]["annotationValue"]
    annotation_counts[annotation] += 1
    }
    return annotation_counts
}