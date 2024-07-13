import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';

class Api {
  Dio api = Dio();
  String? accessToken;

  final _storage = const FlutterSecureStorage();

  Api() {
    api.interceptors
        .add(InterceptorsWrapper(onRequest: (options, handler) async {
      if (!options.path.contains('http')) {
        options.path = 'http://10.0.2.2:5000${options.path}';
      }
      options.headers['Authorization'] = 'Bearer $accessToken';
      options.headers['Content-Type'] = 'application/json';
      String? refreshToken = await _storage.read(key: 'refreshToken');
      options.headers['Cookie'] = 'jwt=$refreshToken';
      return handler.next(options);
    }, onError: (DioException error, handler) async {
      if ((error.response?.statusCode == 403 &&
          error.response?.data['message'] ==
              "JWT Verification failed - Incorrect token")) {
        if (await _storage.containsKey(key: 'token')) {
          await refreshToken();
          return handler.resolve(await _retry(error.requestOptions));
        }
      }
      return handler.next(error);
    }));
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

  Future<void> refreshToken() async {
    try {
      print("Token: $accessToken");
      final response = await api.get('/jwt/refresh');

      if (response.statusCode == 200) {
        final responseData = response.data;
        if (responseData.containsKey('accessToken')) {
          accessToken = responseData['accessToken'];
          await _storage.write(key: 'token', value: accessToken);
        } else {
          print("Error: Access Token Not Found in Response");
          accessToken = null;
          await _storage.deleteAll();
        }
      } else {
        // Refresh Token is wrong
        print(
            "Refresh Token request failed with status code ${response.statusCode}");
        accessToken = null;
        _storage.deleteAll();
      }
    } catch (error) {
      print("Exception during refresh token request: $error");
      accessToken = null;
      await _storage.deleteAll();
    }
  }
}








// class HttpClient {
//   final FlutterSecureStorage _storage = FlutterSecureStorage();

//   Future<http.Response> get(String url, {Map<String, String>? headers}) async {
//     return _handleRequest(
//       () => http.get(Uri.parse(url), headers: headers),
//     );
//   }

//   Future<http.Response> post(String url, {Map<String, String>? headers, dynamic body}) async {
//     return _handleRequest(
//       () => http.post(Uri.parse(url), headers: headers, body: body),
//     );
//   }

//   Future<http.Response> put(String url, {Map<String, String>? headers, dynamic body}) async {
//     return _handleRequest(
//       () => http.put(Uri.parse(url), headers: headers, body: body),
//     );
//   }

//   Future<http.Response> delete(String url, {Map<String, String>? headers, dynamic body}) async {
//     return _handleRequest(
//       () => http.delete(Uri.parse(url), headers: headers, body: body),
//     );
//   }

//   Future<http.Response> _handleRequest(Future<http.Response> Function() request) async {
//     var headers = await _getHeaders();
//     var response = await request();

//     if (response.statusCode == 403) {
//       await _refreshToken();
//       headers = await _getHeaders();
//       response = await request();
//     }

//     return response;
//   }

//   Future<Map<String, String>> _getHeaders() async {
//     final token = await _storage.read(key: 'token');
//     return {
//       'authorization': 'Bearer $token',
//       'content-type': 'application/json',
//     };
//   }

//   Future<void> _refreshToken() async {
//     final url = Uri.parse('http://10.0.2.2:5000/jwt/refresh');

//     try {
//       final response = await http.get(url);

//       if (response.statusCode == 200) {
//         final jsonResponse = json.decode(response.body);
//         var userToken = jsonResponse['accessToken'];
//         await _storage.write(key: 'token', value: userToken);
//       }
//     } catch (error) {
//       print(error);
//     }
//   }
// }



// class AuthorizationInterceptor implements InterceptorContract {
//   @override
//   Future<RequestData> interceptRequest({required RequestData data}) async {
//   final _storage = FlutterSecureStorage();

//     try {
//       var token = _storage.read(key: 'token');

//       data.headers.clear();

//       data.headers['authorization'] = 'Bearer $token';
//       data.headers['content-type'] = 'application/json';
//     } catch (e) {
//       print(e);
//     }

//     return data;
//   }
//   @override
//   Future<ResponseData> interceptResponse({required ResponseData data}) async {
//     return data;
//   }
// }

// class ExpiredTokenRetryPolicy extends RetryPolicy {
//   final storage = FlutterSecureStorage();

//   @override 
//   int maxRetryAttempts = 2;

//   @override
//   Future<bool> shouldAttemptRetryOnResponse(ResponseData response) async {
//     if (response.statusCode == 403) {
//       await refreshToken();
//       return true;
//     }
//     return false;
//   }


//   Future<void> refreshToken() async {
//   final url = Uri.parse('http://10.0.2.2:5000/jwt/refresh');

//   try {
//     final response = await http.get(url);

//     if (response.statusCode == 200) {
//       final jsonResponse = json.decode(response.body);
//       var userToken = jsonResponse['accessToken'];
//       await storage.write(key: 'token', value: userToken);

//     }
    
//   }
//   catch(error) {
//     print(error);
//   }
// }

// }
