import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;


class HttpClient {
  final FlutterSecureStorage _storage = FlutterSecureStorage();

  Future<http.Response> get(String url, {Map<String, String>? headers}) async {
    return _handleRequest(
      () => http.get(Uri.parse(url), headers: headers),
    );
  }

  Future<http.Response> post(String url, {Map<String, String>? headers, dynamic body}) async {
    return _handleRequest(
      () => http.post(Uri.parse(url), headers: headers, body: body),
    );
  }

  Future<http.Response> put(String url, {Map<String, String>? headers, dynamic body}) async {
    return _handleRequest(
      () => http.put(Uri.parse(url), headers: headers, body: body),
    );
  }

  Future<http.Response> delete(String url, {Map<String, String>? headers, dynamic body}) async {
    return _handleRequest(
      () => http.delete(Uri.parse(url), headers: headers, body: body),
    );
  }

  Future<http.Response> _handleRequest(Future<http.Response> Function() request) async {
    var headers = await _getHeaders();
    var response = await request();

    if (response.statusCode == 403) {
      await _refreshToken();
      headers = await _getHeaders();
      response = await request();
    }

    return response;
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'token');
    return {
      'authorization': 'Bearer $token',
      'content-type': 'application/json',
    };
  }

  Future<void> _refreshToken() async {
    final url = Uri.parse('http://10.0.2.2:5000/jwt/refresh');

    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final jsonResponse = json.decode(response.body);
        var userToken = jsonResponse['accessToken'];
        await _storage.write(key: 'token', value: userToken);
      }
    } catch (error) {
      print(error);
    }
  }
}



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
