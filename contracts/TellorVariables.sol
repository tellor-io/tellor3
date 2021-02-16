pragma solidity 0.7.4;


// Helper contract to store hashes of variables
contract TellorVariables {
    // bytes32 public constant devShare = 0x8fe9ded8d7c08f720cf0340699024f83522ea66b2bbfb8f557851cb9ee63b54c; //keccak256("devShare")
    // bytes32 public constant runningTips = 0xdb21f0c4accc4f2f5f1045353763a9ffe7091ceaf0fcceb5831858d96cf84631; //keccak256("runningTips")
    // bytes32 public constant currentReward = 0x9b6853911475b07474368644a0d922ee13bc76a15cd3e97d3e334326424a47d4; //keccak256("currentReward")
    bytes32 public constant requestCount =
        0x05de9147d05477c0a5dc675aeea733157f5092f82add148cf39d579cafe3dc98; //keccak256("requestCount")
    bytes32 public constant totalTip =
        0x2a9e355a92978430eca9c1aa3a9ba590094bac282594bccf82de16b83046e2c3; //keccak256("totalTip")
    bytes32 public constant _tBlock =
        0x969ea04b74d02bb4d9e6e8e57236e1b9ca31627139ae9f0e465249932e824502; //keccak256("_tBlock")
    bytes32 public constant timeOfLastNewValue =
        0x97e6eb29f6a85471f7cc9b57f9e4c3deaf398cfc9798673160d7798baf0b13a4; //keccak256("timeOfLastNewValue")
    bytes32 public constant difficulty =
        0xb12aff7664b16cb99339be399b863feecd64d14817be7e1f042f97e3f358e64e; //keccak256("difficulty")
    bytes32 public constant timeTarget =
        0xad16221efc80aaf1b7e69bd3ecb61ba5ffa539adf129c3b4ffff769c9b5bbc33; //keccak256("timeTarget")
    bytes32 public constant total_supply =
        0xb1557182e4359a1f0c6301278e8f5b35a776ab58d39892581e357578fb287836; //keccak256("total_supply")
    bytes32 public constant _owner =
        0x9dbc393ddc18fd27b1d9b1b129059925688d2f2d5818a5ec3ebb750b7c286ea6; //keccak256("_owner")
    bytes32 public constant requestQPosition =
        0x1e344bd070f05f1c5b3f0b1266f4f20d837a0a8190a3a2da8b0375eac2ba86ea; //keccak256("requestQPosition")
    bytes32 public constant currentTotalTips =
        0xd26d9834adf5a73309c4974bf654850bb699df8505e70d4cfde365c417b19dfc; //keccak256("currentTotalTips")
    bytes32 public constant slotProgress =
        0x6c505cb2db6644f57b42d87bd9407b0f66788b07d0617a2bc1356a0e69e66f9a; //keccak256("slotProgress")
    bytes32 public constant pending_owner =
        0x44b2657a0f8a90ed8e62f4c4cceca06eacaa9b4b25751ae1ebca9280a70abd68; //keccak256("pending_owner")
    bytes32 public constant currentRequestId =
        0x7584d7d8701714da9c117f5bf30af73b0b88aca5338a84a21eb28de2fe0d93b8; //keccak256("currentRequestId")


    //Calculate this hashes
     bytes32 public constant currentChallenge = keccak256("currentChallenge");
     
}
