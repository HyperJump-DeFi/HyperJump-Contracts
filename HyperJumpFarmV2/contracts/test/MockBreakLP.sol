// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '../IHyperswapBreakLP.sol';
/*import '../IHyperswapPair.sol';*/
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import "hardhat/console.sol";

contract MockBreakLP is IHyperswapBreakLP {
    address pair;
    
    function setPair(address _pair) public {
        pair = _pair;
    }
    
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint /*liquidity*/,
        uint /*amountAMin*/,
        uint /*amountBMin*/,
        address to,
        uint /*deadline*/
    ) public override returns (uint amountA, uint amountB) {
        amountA = 1;
        amountB = 1;
        //console.log('IERC20(%s).transfer(%s, %s);', pair, address(0xdead), liquidity);
        //IERC20(pair).transfer(address(0xdead), liquidity);
        uint balA = IERC20(tokenA).balanceOf(address(this));
        console.log('balance A = %s', balA);
        uint userbalA = IERC20(tokenA).balanceOf(to);
        console.log('userbalance A = %s', userbalA);

        console.log('IERC20(%s).transfer(%s, %s);', tokenA, to, amountA);
        IERC20(tokenA).transfer(to, amountA);

        balA = IERC20(tokenA).balanceOf(address(this));
        console.log('balance A = %s', balA);
        userbalA = IERC20(tokenA).balanceOf(to);
        console.log('userbalance A = %s', userbalA);


        uint balB = IERC20(tokenB).balanceOf(address(this));
        console.log('balance B = %s', balB);
        uint userbalB = IERC20(tokenB).balanceOf(to);
        console.log('userbalance B = %s', userbalB);

        console.log('IERC20(%s).transfer(%s, %s);', tokenB, to, amountB);
        IERC20(tokenB).transfer(to, amountB);
        
        balB = IERC20(tokenB).balanceOf(address(this));
        console.log('balance B = %s', balB);
        userbalB = IERC20(tokenB).balanceOf(to);
        console.log('userbalance B = %s', userbalB);

        
        return (uint(amountA), uint(amountB));
    }

}
