import * as axios from 'axios';
import Api from './Api';

jest.mock('axios');

describe('API', () => {
    test('Logout removes token', () => {
        // Arrange
        localStorage.setItem('accessToken', 'abc123');

        // Act
        Api.logout();

        // Assert
        const result = localStorage.getItem('accessToken');
        expect(result).toBe(null);
    });

    test('DoLogin success', async () => {
        // Arrange
        axios.post.mockImplementation(() => {
            return Promise.resolve({
                status: 200,
                data: {
                    accessToken: 'abc123'
                }
            });
        });

        // Act
        const { status, data, message } = await Api.Users.DoLogin('abc@123.com', 'foo');

        // Assert
        expect(status).toBe(200);
        expect(data.accessToken).toBe('abc123');
        expect(message).toBe(undefined);
    });

    test('DoLogin 404', async () => {
        // Arrange
        axios.post.mockImplementation(() => {
            return Promise.resolve({
                status: 404,
                data: {
                    message: 'page does not exist'
                }
            });
        });

        // Act
        const { status, data, message } = await Api.Users.DoLogin('abc@123.com', 'foo');

        // Assert
        expect(status).toBe(404);
        expect(data.accessToken).toBe(undefined);
        expect(message).toBe('page does not exist');
    });
});
