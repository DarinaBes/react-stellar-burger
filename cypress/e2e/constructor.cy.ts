import { setCookie, deleteCookie } from '../../src/utils/cookie';

describe('Тестирование конструктора бургера', () => {
    beforeEach(() => {
        cy.intercept('GET', 'api/ingredients', { fixture: 'ingredients.json' }).as('getIngredients');
        
        cy.visit('/');
    });

    it('добавление булки в конструктор', () => {
        // Проверка, что булка отсутствует в конструкторе
        cy.get('[data-cy="constructorBun1"]').should('not.exist');
        cy.get('[data-cy="constructorBun2"]').should('not.exist');

        // Добавление булки в конструктор
        cy.get('[data-cy="bun-ingredients"]').contains('Добавить').click();

        // Проверка, что булка появилась в конструкторе
        cy.get('[data-cy="constructorBun1"]').contains('Ингредиент 1').should('exist');
        cy.get('[data-cy="constructorBun2"]').contains('Ингредиент 1').should('exist');
    });

    it('добавление начинки в конструктор', () => {
        // Проверка, что начинка отсутствует в конструкторе
        cy.get('[data-cy="constructorIngredients"]').should('not.exist');
        // Добавление начинки в конструктор
        cy.get('[data-cy="mains-ingredients"]').contains('Добавить').click();
        cy.get('[data-cy="sauces-ingredients"]').contains('Добавить').click();
        cy.get('[data-cy="constructorIngredients"]')
        .contains('Ингредиент 2')
        .should('exist');
        cy.get('[data-cy="constructorIngredients"]')
        .contains('Ингредиент 3')
        .should('exist');
    });

    it('открытие и закрытие модального окна ингредиента', () => {
        // Проверка, что модальное окно отсутствует перед открытием
        cy.get('[data-cy="modal"]').should('not.exist');
        // Открытие модального окна ингредиента
        cy.get('[data-cy="ingredient-1"]').click();
        cy.get('[data-cy="modal"]').should('exist');

        // Проверка информации о ингредиенте в модальном окне
        cy.get('[data-cy="modal"]').contains('Ингредиент 1').should('exist');

         // Проверка калорий
        cy.get('[data-cy="modal"]')
            .contains('Калории, ккал')
            .should('exist');
        cy.get('[data-cy="modal"]')
            .contains('420')
            .should('exist');
        // Проверка белков
        cy.get('[data-cy="modal"]')
            .contains('Белки, г')
            .should('exist');
        cy.get('[data-cy="modal"]')
            .contains('80')
            .should('exist');

        // Проверка жиров
        cy.get('[data-cy="modal"]')
            .contains('Жиры, г')
            .should('exist');
        cy.get('[data-cy="modal"]')
            .contains('24')
            .should('exist');

        // Проверка углеводов
        cy.get('[data-cy="modal"]')
            .contains('Углеводы, г')
            .should('exist');
        cy.get('[data-cy="modal"]')
            .contains('53')
            .should('exist');

        // Закрытие модального окна по клику на крестик
        cy.get('[data-cy="modal-close-button"]').click();
        cy.get('[data-cy="modal"]').should('not.exist');

        // Открытие модального окна снова
        cy.get('[data-cy="ingredient-1"]').click();
        cy.get('[data-cy="modal"]').should('exist');

        // Закрытие модального окна по клику на оверлей
        cy.get('[data-cy="modal-overlay"]').click({ force: true });
        cy.get('[data-cy="modal"]').should('not.exist');
    });
});

    describe('тестирование создания заказа', () => {
        beforeEach(() => {
            cy.intercept('GET', 'api/ingredients', { fixture: 'ingredients.json' }).as('getIngredients');
            cy.intercept('GET', 'api/auth/user', { fixture: 'user.json' }).as('getUser');
            cy.intercept('POST', 'api/orders', { fixture: 'order.json' }).as('createOrder');
            cy.visit('/');
            // Установка моковых токенов авторизации
            setCookie('accessToken', 'mockAccessToken');
            localStorage.setItem('refreshToken', 'mockRefreshToken');
        });

        afterEach(() => {
            // Очистка токенов после каждого теста
            localStorage.clear();
            deleteCookie('accessToken');
        });

        it('собираем заказ', () => {
            // Проверка, что кнопка "Оформить заказ" активируется только после добавления булки и хотя бы одного ингредиента
            // Проверка, что кнопка изначально заблокирована
            cy.get('[data-cy="order-design"]').should('be.disabled');

            // Добавление булки
            cy.get('[data-cy="bun-ingredients"]').contains('Добавить').click();

            // Проверка, что кнопка всё ещё заблокирована (нет ингредиентов)
            cy.get('[data-cy="order-design"]').should('be.disabled');

            // Добавление начинки
            cy.get('[data-cy="mains-ingredients"]').contains('Добавить').click();

            // Проверка, что кнопка "Оформить заказ" активирована
            cy.get('[data-cy="order-design"]').should('not.be.disabled');
            cy.get('[data-cy="sauces-ingredients"]').contains('Добавить').click();

            // Оформление заказа
            cy.get('[data-cy="order-design"]').click();

            cy.intercept('POST', 'api/orders', (req) => {
                // Логирование тела запроса для отладки
                console.log('Тело запроса:', req.body);
            }).as('createOrder');
            // Проверка заказа
            cy.wait('@createOrder')
        .its('request.body')
        .should('deep.equal', {
            ingredients: ['1', '2', '3', '1']
        });

            // Проверка номера заказа в модальном окне
            cy.get('[data-cy="order-number"]').should('contain', '12345');

            // Закрытие модального окна
            cy.get('#modals button[aria-label="Закрыть"]').click();
            cy.get('[data-cy="order-number"]').should('not.exist');

            // Проверка очистки конструктора бургера от добавленных ингредиентов
            cy.get('[data-cy="constructor"]')
            .contains('Ингредиент 1')
            .should('not.exist');
            cy.get('[data-cy="constructor"]')
            .contains('Ингредиент 3')
            .should('not.exist');
            cy.get('[data-cy="constructor"]')
            .contains('Ингредиент 4')
            .should('not.exist');
        });
    });
