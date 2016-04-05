//HELPER FUNCTIONS
//
//

var round = function(num){
  var changedNum = num.toFixed(2);
  return Number(changedNum);
};

var each = function(array,callback){
  for(var i = 0;i<array.length;i++){
    callback(array[i],i,array);
  }
};

var map = function (array, callback){
  var mapArr = [];
  each(array,function (elem,ind,arr) {
    mapArr.push(callback(elem,ind,arr));
  });
  return mapArr;
};

var pluckIntoNumber = function (array,property){
return map (array, function (elem) {
    return round(Number(elem[property]));
  });
};

var reduce = function (array,callback) {
  var answer;
  each (array,function (elem,ind) {
    if (ind === 0) {
      answer = elem;
    } else {
      answer = callback(answer,elem);
    }
  });
  return answer;
};


//JAVASCRIPT LOGIC
//
//

var loanCalcs = function(loanInfo) {

//monRate is the monthly rate (instead of the annual rate)
//monPay is the accounting formula to calculate the monthly payment
//   M = P * ((I + 1)^N) * I / (((I + 1)^N)-1)
//totalPay is the total amount paid (interest + principal combined)
//totalInt is the total amount of interest paid if there is no additional principal payments for the life of the loan
//annPay is the how much would be paid each year
//round is used to keep everything that is returned in 2 decimals

  loanInfo.monRate = loanInfo.interest / 1200;
  loanInfo.monPay = round((loanInfo.monRate + (loanInfo.monRate/(Math.pow((1+loanInfo.monRate),loanInfo.term)-1))) * loanInfo.principal);
  loanInfo.totalPay = round(loanInfo.monPay * loanInfo.term);
  loanInfo.totalInt = round(loanInfo.totalPay - loanInfo.principal);
  loanInfo.annPay = round(loanInfo.monPay * 12);

  return loanInfo;
};

var amSchedCreater = function(loanInfo) {
  //var declarations to make the schedule calculations less wordy
  principal = loanInfo.principal;
  interest = loanInfo.interest;
  term = loanInfo.term;
  extra =  loanInfo.extra;
  monRate = loanInfo.monRate;
  monPay = loanInfo.monPay;
  totalPay = loanInfo.totalPay;
  totalInt = loanInfo.totalInt;
  annPay = loanInfo.annPay;

  var amSched = [];
  //month 1 has diff calculations
  amSched.push({
    Month:1,
    "Payment Remaining":principal,
    "Interest Paid": monRate * principal,
    "Total Interest Paid": monRate * principal,
    "Principal Paid": monPay-(monRate * principal),
    "Remaining Loan Balance": principal-(monPay-(monRate * principal))-extra
  });

  for(var i = 1; i< term; i++) {
    if(amSched[i-1]["Remaining Loan Balance"] > 0){
//the last month
      if(amSched[i-1]["Remaining Loan Balance"] < monPay + extra){
        amSched.push({
          Month: i+1,
          "Payment Remaining": round(amSched[i-1]["Remaining Loan Balance"]),
          "Interest Paid": round((amSched[i-1]["Remaining Loan Balance"]) * monRate),
          "Total Interest Paid": round(((amSched[i-1]["Remaining Loan Balance"]) * monRate)+(amSched[i-1]["Total Interest Paid"])),
          "Principal Paid": round(amSched[i-1]["Remaining Loan Balance"]),
          "Remaining Loan Balance": 0
        });
        break;
      }
//months 2 through term -1 
      amSched.push({
        Month: i+1,
        "Payment Remaining": round(amSched[i-1]["Remaining Loan Balance"]),
        "Interest Paid": round((amSched[i-1]["Remaining Loan Balance"]) * monRate),
        "Total Interest Paid": round(((amSched[i-1]["Remaining Loan Balance"]) * monRate) + (amSched[i-1]["Total Interest Paid"])),
        "Principal Paid": round((monPay - (amSched[i-1]["Remaining Loan Balance"])*monRate) + extra),
        "Remaining Loan Balance": round((amSched[i-1]["Remaining Loan Balance"])-(monPay - (amSched[i-1]["Remaining Loan Balance"]) * monRate) - extra)
      });
    }
  }

  return amSched;
};

//math for extra monthly payments
var extraCalcs = function(loanInfo, amSched) {

  var totalInterestArray = pluckIntoNumber(amSched,"Interest Paid");
  var actualInterest = (reduce(totalInterestArray,function(a,b){return a + b;}));


  loanInfo["Extra Payment Information"] = {};
  loanInfo["Extra Payment Information"]["Interest Saving"] = round(totalInt - actualInterest);
  loanInfo["Extra Payment Information"]["Payoff Earlier By"] = round(term - amSched[amSched.length-1]["Month"]);
  
  return loanInfo;
};




var testInfo = {};
testInfo.principal = 800000;
testInfo.interest = 3.75;
testInfo.term = 60;
testInfo.extra =  2000;

var testCalculations = loanCalcs(testInfo);
var testAmSched = amSchedCreater(testInfo);

var testExtra = extraCalcs(testCalculations, testAmSched);

console.log(testCalculations);




//ANGULAR STUFF
// 
//

angular.module('app', [])
.controller('loanInfoCtrl', ['$scope', function($scope) {
  $scope.master = {};

  $scope.update = function(loan){
    $scope.master = angular.copy(loanInfo);
  };
  $scope.reset = function () {
    $scope.loan.principal = '';
    $scope.loan.interest = '';
    $scope.loan.term = '';
    $scope.loan.extra = '0';
  };


}]);
