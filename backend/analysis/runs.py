import itertools as it

def EctopicRunsAnalysis(annotated_samples):
  g = [{'annotation':annotation, 'samples':list(group)} for annotation, group in it.groupby(annotated_samples, lambda x: x['annotation'])]

  def FixedLength(length, annotation):
      return lambda x: len(x['samples']) == length and x['annotation'] == annotation

  def LongerThan(length, annotation):
      return lambda x: len(x['samples']) > length and x['annotation'] == annotation

  duplets_s = [i for i in filter(FixedLength(2,'S'), g)]
  duplets_v = [i for i in filter(FixedLength(2, 'V'), g)]
  triplets_s = [i for i in filter(FixedLength(3,'S'), g)]
  triplets_v = [i for i in filter(FixedLength(3,'V'), g)]
  runs_s = [i for i in filter(LongerThan(3, 'S'), g)]
  runs_v = [i for i in filter(LongerThan(3, 'V'), g)]
  return {'duplets_s' : duplets_s,
          'duplets_v' : duplets_v,
          'triplets_s' : triplets_s,
          'triplets_v' : triplets_v,
          'runs_s' : runs_s,
          'runs_v' : runs_v
          }