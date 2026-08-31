import * as utils from 'web3-utils';
import axios from 'axios';

const ffjavascript = require('ffjavascript');

require('dotenv').config();

function p256(n:any) {
    let nstr = n.toString(16);
    while (nstr.length < 64) nstr = `0${nstr}`;
    nstr = `0x${nstr}`;
    return nstr;
}

const { unstringifyBigInts: unstringifyBigInts$1} = ffjavascript.utils;

async function exportSolidityCallData(_proof:any, _pub:any) {
    const proof = unstringifyBigInts$1(_proof);
    const pub = unstringifyBigInts$1(_pub);

    const inputs:any[] = [];
    for (let i=0; i<pub.length; i++) {
        inputs.push(p256(pub[i]))
    }

    return {
        a:[p256(proof.pi_a[0]), p256(proof.pi_a[1])],
        b:[[p256(proof.pi_b[0][1]), p256(proof.pi_b[0][0])],[p256(proof.pi_b[1][1]), p256(proof.pi_b[1][0])]],
        c:[p256(proof.pi_c[0]), p256(proof.pi_c[1])],
        input: inputs
    }
}

const generateHash = async(data:any) =>
    utils.sha3(utils.encodePacked(
        {value: data.uri, type: 'string'},
        {value: data.secret, type: 'string'},
    ) as string)

const generateInput = async (data:any) => {

    console.log(process.env.URL_APP_RUNNER_ZKSNARK as string, data);

    const response = (await axios.post(process.env.URL_APP_RUNNER_ZKSNARK as string, data)).data;
    
    return exportSolidityCallData(response.proof, response.public);
}

export {
    generateInput,
    generateHash
};