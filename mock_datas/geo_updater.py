import sys
import json
import random



def readAndUpdate(file):
    f = open(file, 'r')
    data = json.loads(f.read())
    f.close()
    
    for row in data['features']:
        row['properties']['age'] = random.randint(20, 70)

    return data
    
def writeToFile(content, outfile):
    content = json.dumps(content)
    f = open(outfile, 'w')
    f.write(content)
    f.close()

if __name__ == '__main__':
    updated_data = readAndUpdate(sys.argv[1])
    writeToFile( updated_data, sys.argv[2])
