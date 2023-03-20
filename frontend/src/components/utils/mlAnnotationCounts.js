export function mlAnnotationCounts(automatic_classification) {

    const annotation_counts = {"N": 0, "U": 0, "S": 0, "V": 0}

    for (let i = 0; i < automatic_classification.length; i++) {
    const annotation = automatic_classification[i]["annotation"]
    annotation_counts[annotation] += 1
    }
    return annotation_counts
}