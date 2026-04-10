import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../models/generator_models.dart';

abstract class GeneratorRemoteDataSource {
  Future<List<ContractCategoryModel>> getCategories();
  Future<void> generateContract(String category, String requirements);
  Future<List<GeneratedContractModel>> getHistory();
  Stream<String> get generationStream;
}

class GeneratorRemoteDataSourceImpl implements GeneratorRemoteDataSource {
  final ApiClient apiClient;
  final StreamController<String> _streamController =
      StreamController<String>.broadcast();

  GeneratorRemoteDataSourceImpl(this.apiClient);

  @override
  Stream<String> get generationStream => _streamController.stream;

  @override
  Future<List<ContractCategoryModel>> getCategories() async {
    final response = await apiClient.get(ApiConstants.generatorCategories);
    return (response.data as List)
        .map((e) => ContractCategoryModel.fromJson(e))
        .toList();
  }

  @override
  Future<void> generateContract(String category, String requirements) async {
    try {
      final response = await apiClient.dio.post(
        ApiConstants.generatorGenerate,
        data: {
          'category': category,
          'requirements': requirements,
        },
        options: Options(responseType: ResponseType.stream),
      );

      final stream = response.data.stream as Stream<List<int>>;

      stream.transform(utf8.decoder).transform(const LineSplitter()).listen(
        (line) {
          if (line.startsWith('data: ')) {
            final data = line.substring(6);
            if (data.trim().isEmpty) return;

            try {
              final json = jsonDecode(data);
              if (json['chunk'] != null) {
                _streamController.add(json['chunk']);
              } else if (json['error'] != null) {
                _streamController.addError(json['error']);
              }
            } catch (e) {
              // Ignore
            }
          }
        },
        onError: (e) {
          _streamController.addError(e);
        },
        cancelOnError: true,
      );
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<List<GeneratedContractModel>> getHistory() async {
    final response = await apiClient.get(ApiConstants.generatorHistory);
    return (response.data as List)
        .map((e) => GeneratedContractModel.fromJson(e))
        .toList();
  }
}
