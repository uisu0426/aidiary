export const normalize = (text) => (text || "").replace(/\s+/g, ' ').trim();

const sortInputs = (inputs) =>
  [...inputs].sort((a, b) => {
    const aKey = normalize(a.raw_input + a.diary);
    const bKey = normalize(b.raw_input + b.diary);
    return aKey.localeCompare(bKey);
  });

export const isSameDiaryInputs = (current, saved) => {
  const sortedCurrent = sortInputs(current);
  const sortedSaved = sortInputs(saved);

  if (sortedCurrent.length !== sortedSaved.length) return false;

  return sortedCurrent.every((input, i) =>
    normalize(input.raw_input) === normalize(sortedSaved[i]?.raw_input) &&
    normalize(input.diary) === normalize(sortedSaved[i]?.diary)
  );
};