// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/*import '../IHyperswapPair.sol';*/
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract MockPair is /*IHyperswapPair,*/ ERC20 {
     address public token0;
     address public token1;
     
     constructor() ERC20('Mocked Pair', 'MOCKPAIR') {
        _mint(msg.sender, 1e18);
     }
     
     function init(address _token0, address _token1) public {
        token0 = _token0;
        token1 = _token1;
     }
}
