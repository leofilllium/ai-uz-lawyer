import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../models/contract_analysis_model.dart';

abstract class ValidatorRemoteDataSource {
  Future<ContractAnalysisModel> analyzeContract(String contractText);
  Future<List<ContractAnalysisModel>> getHistory();
}

class ValidatorRemoteDataSourceImpl implements ValidatorRemoteDataSource {
  final ApiClient apiClient;

  ValidatorRemoteDataSourceImpl(this.apiClient);

  @override
  Future<ContractAnalysisModel> analyzeContract(String contractText) async {
    final response = await apiClient.post(
      ApiConstants.validatorAnalyze,
      data: {'contract': contractText},
    );

    // The response structure might be slightly different based on the backend
    // Backend returns ValidateContractResponse which includes audit object
    final audit = response.data['audit'];
    final analysisId = response.data['analysis_id'];
    final sessionId = response.data['session_id'];

    // Combine into a model
    Map<String, dynamic> combined = Map.from(audit);
    combined['id'] = analysisId;
    combined['session_id'] = sessionId;
    combined['contract_text'] = contractText;

    return ContractAnalysisModel.fromJson(combined);
  }

  @override
  Future<List<ContractAnalysisModel>> getHistory() async {
    final response = await apiClient.get(ApiConstants.validatorHistory);
    return (response.data as List)
        .map((e) => ContractAnalysisModel.fromJson(e))
        .toList();
  }
}
