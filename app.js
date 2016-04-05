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

  loanInfo.amSched = [];
  //month 1 has diff calculations
  loanInfo.amSched.push({
    Month:1,
    "Payment Remaining":principal,
    "Interest Paid": monRate * principal,
    "Total Interest Paid": monRate * principal,
    "Principal Paid": monPay-(monRate * principal),
    "Remaining Loan Balance": principal-(monPay-(monRate * principal))-extra
  });

  for(var i = 1; i< term; i++) {
    if(loanInfo.amSched[i-1]["Remaining Loan Balance"] > 0){
//the last month
      if(loanInfo.amSched[i-1]["Remaining Loan Balance"] < monPay + extra){
        loanInfo.amSched.push({
          Month: i+1,
          "Payment Remaining": round(loanInfo.amSched[i-1]["Remaining Loan Balance"]),
          "Interest Paid": round((loanInfo.amSched[i-1]["Remaining Loan Balance"]) * monRate),
          "Total Interest Paid": round(((loanInfo.amSched[i-1]["Remaining Loan Balance"]) * monRate)+(loanInfo.amSched[i-1]["Total Interest Paid"])),
          "Principal Paid": round(loanInfo.amSched[i-1]["Remaining Loan Balance"]),
          "Remaining Loan Balance": 0
        });
        break;
      }
//months 2 through term -1 
      loanInfo.amSched.push({
        Month: i+1,
        "Payment Remaining": round(loanInfo.amSched[i-1]["Remaining Loan Balance"]),
        "Interest Paid": round((loanInfo.amSched[i-1]["Remaining Loan Balance"]) * monRate),
        "Total Interest Paid": round(((loanInfo.amSched[i-1]["Remaining Loan Balance"]) * monRate) + (loanInfo.amSched[i-1]["Total Interest Paid"])),
        "Principal Paid": round((monPay - (loanInfo.amSched[i-1]["Remaining Loan Balance"])*monRate) + extra),
        "Remaining Loan Balance": round((loanInfo.amSched[i-1]["Remaining Loan Balance"])-(monPay - (loanInfo.amSched[i-1]["Remaining Loan Balance"]) * monRate) - extra)
      });
    }
  }

  loanInfo.amSched.unshift({
    Month: "Month",
    "Payment Remaining": "Payment Remaining",
    "Interest Paid": "Interest Paid",
    "Total Interest Paid": "Total Interest Paid",
    "Principal Paid": "Principal Paid",
    "Remaining Loan Balance": "Remaining Loan Balance"
  });

  return loanInfo;
};

//math for extra monthly payments
var extraCalcs = function(loanInfo) {

  var actualInterest = loanInfo.amSched[loanInfo.amSched.length - 1]["Total Interest Paid"];

  loanInfo["Extra Payment Information"] = {};
  loanInfo["Extra Payment Information"]["Interest Saving"] = round(loanInfo.totalInt - actualInterest);
  loanInfo["Extra Payment Information"]["Payoff Earlier By"] = round(term - loanInfo.amSched[loanInfo.amSched.length-1]["Month"]);
  
  return loanInfo;
};



//ANGULAR STUFF
// 
//

angular.module('app', [])
.controller('loanInfoCtrl', ['$scope', function($scope) {
  $scope.master = {};
  $scope.amSched =[];

  $scope.reset = function () {
    $scope.loan.principal = '0';
    $scope.loan.interest = '0';
    $scope.loan.term = '0';
    $scope.loan.extra = '0';
  };

  $scope.calculate = function(loanInfo) {
//turn all stringified numbers into numbers
    for(var prop in loanInfo) {
      if (typeof loanInfo[prop] === 'string') {
        loanInfo[prop] = Number(loanInfo[prop]);
      }
    }
//render
    var tempLoanValues = loanCalcs(loanInfo);
    for(var key in tempLoanValues) {
      $scope.loan[key] = tempLoanValues[key];
    }
  };



  $scope.createAmSched = function(loanInfo) {
//create amSched
    amSchedCreater(loanInfo);
//extra payment info, if any
    if(loanInfo.extra !== 0) {
      extraCalcs(loanInfo);
    }
//render
    $scope.loan.amSched = loanInfo.amSched;
    $scope.loan["Extra Payment Information"] = loanInfo["Extra Payment Information"];

  };

  $scope.display = function(loanInfo) {
    if(loanInfo.extra === undefined){
      extra = 0;
    }

    var displayLoan = {};

    $scope.calculate(loanInfo);
    $scope.createAmSched(loanInfo);

    for(var key in loanInfo) {
      displayLoan[key] = loanInfo[key];
    }


    
    $scope.displayLoan = displayLoan;
    $scope.displaySched = displayLoan.amSched;



    $scope.tableTitle = "Loan Amortization Table:";


    $scope.prin = "Starting Principal: $" + displayLoan.principal;
    $scope.interest = "Interest Rate: " + displayLoan.interest + "%";
    $scope.term = "Term: " + displayLoan.term + " Months";
    $scope.extra = "Additional Payments Towards Principal: $" + displayLoan.extra;
    $scope.monPay = "Monthly Payment: $" + displayLoan.monPay;
    $scope.totalInt = "Total Interest: $" + displayLoan.totalInt;
    $scope.totalPay = "Total Payment: $" + displayLoan.totalPay;
    $scope.annPay = "Annual Payments: $" + displayLoan.annPay;

    $scope.monSaved = "Interest Saved: $" + displayLoan["Extra Payment Information"]["Interest Saving"];
    $scope.monShortened = "Payoff earlier by: " + displayLoan["Extra Payment Information"]["Payoff Earlier By"] + " Months!";

  };


}]);
