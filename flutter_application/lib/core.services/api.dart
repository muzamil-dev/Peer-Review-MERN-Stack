import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';

// API REQUEST INTERCEPTORS
class Api {
  Dio api = Dio();
  final _storage = const FlutterSecureStorage();
  bool _isRefreshing = false;

  Api() {
    api.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Cookie Implementation for JWT REFRESH TOKEN
        if (options.path == '/jwt/refresh') {
          String? refreshToken = await _storage.read(key: 'refreshToken');
          options.headers['Cookie'] = 'jwt=$refreshToken';
        }

        if (!options.path.contains('http')) {
          options.path = 'http://10.0.2.2:5000${options.path}';
        }

        String? accessToken = await _storage.read(key: 'accessToken');
        options.headers['Authorization'] = 'Bearer $accessToken';
        options.headers['Content-Type'] = 'application/json';

        return handler.next(options);
      },
      onError: (DioException error, handler) async {
        if (error.response?.statusCode == 403 &&
            error.response?.data['message'] ==
                "JWT Verification failed - Incorrect token") {
          if (await _storage.containsKey(key: 'accessToken')) {
            if (!_isRefreshing) {
              _isRefreshing = true;
              String? accessToken = await _storage.read(key: 'accessToken');
              await _refreshToken(accessToken);

              _isRefreshing = false;

              if (error.requestOptions.extra['retryCount'] == null) {
                error.requestOptions.extra['retryCount'] = 0;
              }

              if (error.requestOptions.extra['retryCount'] < 2) {
                error.requestOptions.extra['retryCount']++;
                return handler.resolve(await _retry(error.requestOptions));
              } else {
                await _storage.deleteAll();
                return handler.reject(DioException(
                    requestOptions: error.requestOptions,
                    response: error.response,
                    error: "Authentication failed. Please log in again"));
              }
            }
          }
        } else if (error.response?.statusCode == 401 &&
            error.response?.data['message'] ==
                "The email/password combination was incorrect") {
          return handler.resolve(error.response!);
        }
      },
    ));
  }

  Future<Response<dynamic>> _retry(RequestOptions requestOptions) async {
    print("Retrying request to ${requestOptions.path}");
    final options = Options(
      method: requestOptions.method,
      headers: requestOptions.headers,
    );
    return api.request<dynamic>(requestOptions.path,
        data: requestOptions.data,
        queryParameters: requestOptions.queryParameters,
        options: options);
  }

  Future<void> _refreshToken(String? accessToken) async {
    try {
      final response = await api.get('/jwt/refresh');
      if (response.statusCode == 200) {
        final responseData = response.data;
        if (responseData.containsKey('accessToken')) {
          String newAccessToken = responseData['accessToken'];
          await _storage.write(key: 'accessToken', value: newAccessToken);
        } else {
          print("Error: Access Token Not Found in Response");
          await _storage.deleteAll();
        }
      } else {
        print(
            "Refresh Token request failed with status code ${response.statusCode}");
        await _storage.deleteAll();
      }
    } catch (error) {
      print("Exception during refresh token request: $error");
      await _storage.deleteAll();
    }
  }
}
