import { GRADES, TAUGHT_CLASSES } from '../classOptions.js';

export function renderGradeCheckboxes(container, selectedGrades = []) {
  container.innerHTML = GRADES.map(
    (g) => `<label><input type="checkbox" value="${g}" ${selectedGrades.includes(g) ? 'checked' : ''} /> ${g} 年級</label>`
  ).join('');
}

export function getSelectedGrades(container) {
  return Array.from(container.querySelectorAll('input:checked')).map((el) => el.value);
}

export function renderClassGrid(container, selectedClasses = []) {
  container.innerHTML = GRADES.map(
    (g) => `
      <fieldset>
        <legend>${g} 年級</legend>
        ${TAUGHT_CLASSES[g].map((c) => {
          const code = `${g}${c}`;
          return `<label><input type="checkbox" value="${code}" ${selectedClasses.includes(code) ? 'checked' : ''} /> ${Number(c)} 班</label>`;
        }).join('')}
      </fieldset>
    `
  ).join('');
}

export function getSelectedClasses(container) {
  return Array.from(container.querySelectorAll('input:checked')).map((el) => el.value);
}
