export default class SortableTable {
    element;
    subElements = {};
    headersConfig = [];
    data = [];
    order = null;

    clickTitle = (element) => {
        const { id: field, sortable: isSortable } = element.dataset;

        if (isSortable === 'true') {
            element.addEventListener('pointerdown', () => {
                const { order } = element.dataset;
                this.sort(field, (order === 'desc') ? 'asc' : 'desc');
            });
        }
    }

    constructor(headersConfig, {
        data = []
    } = {}) {
        this.headersConfig = headersConfig;
        this.data = data;

        this.render();
        this.setEventOnTitle();
    }

    setEventOnTitle() {
        const { children: titles } = this.subElements.header;
        
        for (const title of titles) {
            this.setDefaultFieldForSort(title);
            this.clickTitle(title);
        }
    }

    setDefaultFieldForSort(elem) {
        const title = this.headersConfig.find(item => item.sortable).id;
        if (elem.dataset.id === title) { 
            this.sort(elem.dataset.id, 'asc');
        }
    }

    getTableHeader() {
        return `<div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.headersConfig.map(item => this.getHeaderRow(item)).join('')}</div>`;
    }

    getHeaderRow({ id, title, sortable }) {
        return `
        <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
          <span>${title}</span>
          ${this.getHeaderSortingArrow()}
        </div>
      `;
    }

    getHeaderSortingArrow() {
        return `
        <span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>`;
    }

    getTableBody(data) {
        return `
        <div data-element="body" class="sortable-table__body">
          ${this.getTableRows(data)}
        </div>`;
    }

    getTableRows(data) {
        return data.map(item => `
        <div class="sortable-table__row">
          ${this.getTableRow(item, data)}
        </div>`
        ).join('');
    }

    getTableRow(item) {
        const cells = this.headersConfig.map(({ id, template }) => {
            return {
                id,
                template
            };
        });

        return cells.map(({ id, template }) => {
            return template
                ? template(item[id])
                : `<div class="sortable-table__cell">${item[id]}</div>`;
        }).join('');
    }

    getTable(data) {
        return `
        <div class="sortable-table">
          ${this.getTableHeader()}
          ${this.getTableBody(data)}
        </div>`;
    }

    render() {
        const $wrapper = document.createElement('div');

        $wrapper.innerHTML = this.getTable(this.data);

        const element = $wrapper.firstElementChild;

        this.element = element;
        this.subElements = this.getSubElements(element);
    }

    sort(field, order) {
        const sortedData = this.sortData(field, order);
        const allColumns = this.element.querySelectorAll('.sortable-table__cell[data-id]');
        const currentColumn = this.element.querySelector(`.sortable-table__cell[data-id="${field}"]`);

        // NOTE: Remove sorting arrow from other columns
        allColumns.forEach(column => {
            column.dataset.order = '';
        });

        currentColumn.dataset.order = order;

        this.subElements.body.innerHTML = this.getTableRows(sortedData);
    }

    sortData(field, order) {
        const arr = [...this.data];
        const column = this.headersConfig.find(item => item.id === field);
        const { sortType, customSorting } = column;
        const direction = order === 'asc' ? 1 : -1;

        return arr.sort((a, b) => {
            switch (sortType) {
                case 'number':
                    return direction * (a[field] - b[field]);
                case 'string':
                    return direction * a[field].localeCompare(b[field], 'ru');
                case 'custom':
                    return direction * customSorting(a, b);
                default:
                    return direction * (a[field] - b[field]);
            }
        });
    }

    getSubElements(element) {
        const elements = element.querySelectorAll('[data-element]');

        return [...elements].reduce((accum, subElement) => {
            accum[subElement.dataset.element] = subElement;

            return accum;
        }, {});
    }

    remove() {
        this.element.remove();
    }

    destroy() {
        this.remove();
        this.subElements = {};
    }
}