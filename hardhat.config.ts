import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-ethers";
import { expect } from 'chai';

import * as dotenv from "dotenv";
dotenv.config();

task(
  "xfer-contract-multisig",
  "Transfer ownership of contract to multisig")
  .addParam("multisig", "The address of the multisig on polygon")
  .addParam("contract", "The address of the deployed contract")
.setAction(async (taskArgs, hre) => {

  const multisig = taskArgs.multisig;
  const contractAddress = taskArgs.contract;
  const DEFAULT_ADMIN_ROLE = "DEFAULT_ADMIN_ROLE";
  const [deployer] = await hre.ethers.getSigners();

  const Contract = await hre.ethers.getContractFactory("Lock");
  const contract = await Contract.attach(contractAddress);
  
  // grant multisig DEFAULT_ADMIN_ROLE
  const grantAdminTx = await contract.grantRole(DEFAULT_ADMIN_ROLE, multisig);
  await grantAdminTx.wait();
  const correctMultisigRole = await contract.hasRole(
    DEFAULT_ADMIN_ROLE,
    multisig
  );
  expect(correctMultisigRole).to.be.true;
  console.log(`PartnerNFT: Grant DEFAULT_ADMIN_ROLE to multisig: ${multisig}`);
  
  // revoke deployer DEFAULT_ADMIN_ROLE
  const revokeAdminTx = await contract.renounceRole(
    DEFAULT_ADMIN_ROLE,
    deployer.address
  );
  await revokeAdminTx.wait();
  const correctDeployerRole = await contract.hasRole(
    DEFAULT_ADMIN_ROLE,
    deployer.address
  );
  expect(correctDeployerRole).to.be.false;
  console.log( `PartnerNFT: Revoke DEFAULT_ADMIN_ROLE from deployer: ${deployer}`);
  
  console.log("Transferred ownership to:", multisig);
});


const config: HardhatUserConfig = {
  solidity: "0.8.9",
  networks: {
    mumbai: {
      url: 
        process.env.RPC_URL !== undefined
          ? process.env.RPC_URL
          : "",
      accounts:
        process.env.DEPLOYER_PRIVATE_KEY !== undefined
          ? [process.env.DEPLOYER_PRIVATE_KEY]
          : [],
    }
  }
};

export default config;